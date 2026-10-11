const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('../config/env');
const imageAuthenticityService = require('./imageAuthenticityService');
const { DEPARTMENTS } = require('../constants/departments');

class ImageVerificationService {
  constructor() {
    this.genAI = null;
    this.modelName = config.gemini.model || 'gemini-3.8-flash';

    if (config.gemini.apiKey) {
      try {
        this.genAI = new GoogleGenerativeAI(config.gemini.apiKey);
        console.log(`[ImageVerificationService] Generative AI initialized with model: ${this.modelName}`);
      } catch (err) {
        console.warn(`[ImageVerificationService] Initialization error: ${err.message}`);
      }
    } else {
      console.log(`[ImageVerificationService] GEMINI_API_KEY not set. Live vision analysis will report service status transparently.`);
    }
  }

  /**
   * Validates image readability, format, and size
   */
  validateImageBuffer(buffer, mimeType = 'image/jpeg') {
    if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
      return { valid: false, error: 'Empty or invalid image data provided.' };
    }

    // 10 MB maximum upload limit
    const maxBytes = 10 * 1024 * 1024;
    if (buffer.length > maxBytes) {
      return {
        valid: false,
        error: `Image size exceeds the 10 MB limit (${(buffer.length / (1024 * 1024)).toFixed(1)} MB uploaded).`
      };
    }

    // Magic bytes verification
    const isJpeg = buffer.length > 2 && buffer[0] === 0xFF && buffer[1] === 0xD8;
    const isPng = buffer.length > 8 && buffer.slice(0, 8).toString('hex') === '89504e470d0a1a0a';
    const isWebp = buffer.length > 12 && buffer.slice(0, 4).toString() === 'RIFF' && buffer.slice(8, 12).toString() === 'WEBP';

    if (!isJpeg && !isPng && !isWebp) {
      return {
        valid: false,
        error: 'Unsupported image format. Please upload a clear photograph in JPEG, PNG, or WebP format.'
      };
    }

    return { valid: true };
  }

  _getModelCandidates() {
    return [
      this.modelName,
      'gemini-3.1-flash-lite',
      'gemini-3.5-flash-lite',
      'gemini-flash-lite-latest',
      'gemini-3.6-flash',
      'gemini-3.7-flash'
    ].filter(Boolean);
  }

  /**
   * Primary image verification workflow:
   * 1. Validates image buffer
   * 2. Detects civic problem using multimodal vision model
   * 3. Evaluates image authenticity (AI generation / manipulation signals)
   * 4. Extracts EXIF GPS metadata if present (as separate optional evidence)
   */
  async verifyCivicImage(imageBuffer, mimeType = 'image/jpeg', citizenDescription = '') {
    // Step 1: Validate file
    const validation = this.validateImageBuffer(imageBuffer, mimeType);
    if (!validation.valid) {
      return {
        success: false,
        validationError: validation.error,
        civicDetection: {
          isCivicIssue: false,
          category: 'none',
          issueTitle: 'Invalid Image',
          description: validation.error,
          confidenceScore: null,
          uncertaintyOrLimitations: 'File validation failure',
          isUncertain: true,
          rejectionReason: validation.error
        },
        authenticityAnalysis: {
          status: 'UNAVAILABLE',
          stateLabel: 'Authenticity Check Unavailable',
          statement: 'Could not inspect image due to file format validation error.',
          confidenceScore: null,
          signalsChecked: [],
          detectedSignals: [],
          detectorInfo: 'N/A'
        },
        exifMetadata: { hasExifGps: false },
        verificationSummary: {
          status: 'REJECTED_INVALID_FILE',
          canProceedToSubmit: false,
          requiresManualReview: false
        }
      };
    }

    // Step 2: Run Civic Problem Detection with candidate models
    let civicDetection = null;
    let activeGeminiModel = null;

    if (this.genAI) {
      const candidates = this._getModelCandidates();
      for (const m of candidates) {
        try {
          const model = this.genAI.getGenerativeModel({ model: m });
          civicDetection = await this._analyzeWithGeminiVision(model, imageBuffer, mimeType, citizenDescription);
          if (civicDetection) {
            activeGeminiModel = model;
            break;
          }
        } catch (visionErr) {
          console.warn(`[ImageVerificationService] Vision model ${m} failed: ${visionErr.message}. Trying next candidate.`);
        }
      }
    }

    if (!civicDetection) {
      civicDetection = {
        serviceConfigured: false,
        isCivicIssue: false,
        category: 'none',
        issueTitle: 'Unable to Verify Image',
        description: 'The automated image verification service could not verify this image. Please upload a clear photo of the civic problem.',
        confidenceScore: null,
        uncertaintyOrLimitations: 'AI vision models unreachable.',
        isUncertain: true,
        rejectionReason: 'Unable to verify a valid civic infrastructure defect.'
      };
    }

    // Step 3: Run Authenticity Analysis (Deepfake / AI Generation / Synthetic Check)
    const authenticity = await imageAuthenticityService.evaluateAuthenticity(imageBuffer, mimeType, activeGeminiModel);

    // Step 4: Determine overall verification verdict
    let overallStatus = 'REJECTED_NO_CIVIC_PROBLEM';
    let canProceed = false;
    let requiresManualReview = false;

    const isSyntheticOrAi = authenticity.status === 'SUSPICIOUS' || Boolean(civicDetection.isAiOrSynthetic);

    if (!civicDetection.serviceConfigured) {
      overallStatus = 'AI_SERVICE_UNAVAILABLE';
      canProceed = false;
    } else if (isSyntheticOrAi) {
      // AI-generated / deepfake / synthetic artwork / anime detected
      overallStatus = 'AUTHENTICITY_WARNING';
      civicDetection.isCivicIssue = false;
      civicDetection.category = 'none';
      civicDetection.issueTitle = 'AI-Generated / Synthetic Image Detected';
      civicDetection.rejectionReason = civicDetection.rejectionReason || 'Image exhibits signals of AI generation, synthetic media, or digital artwork.';
      canProceed = false;
      requiresManualReview = true;
    } else if (!civicDetection.isCivicIssue) {
      // Non-problem image (scenery, landscape, anime, selfie, pet, meme, living room, etc.)
      overallStatus = 'REJECTED_NO_CIVIC_PROBLEM';
      canProceed = false;
      requiresManualReview = false;
    } else if (civicDetection.isUncertain) {
      // Blurry, unidentifiable image
      overallStatus = 'UNCERTAIN_CIVIC_PROBLEM';
      canProceed = false;
      requiresManualReview = false;
    } else {
      // Genuine real camera photograph of an authentic civic problem
      overallStatus = 'VERIFIED_CIVIC_PROBLEM';
      canProceed = true;
      requiresManualReview = false;
    }

    return {
      success: true,
      civicDetection,
      authenticityAnalysis: authenticity,
      exifMetadata: authenticity.exifDetails || { hasExifGps: false },
      verificationSummary: {
        status: overallStatus,
        canProceedToSubmit: canProceed,
        requiresManualReview
      }
    };
  }

  /**
   * Multimodal vision analysis via Google Gemini API
   */
  async _analyzeWithGeminiVision(model, imageBuffer, mimeType, citizenDescription) {
    const prompt = `You are the Official Civil Infrastructure AI Inspector for Lok Samadhan (Public Grievance System, Govt of India).
Analyze this uploaded photograph submitted by a citizen, alongside any optional citizen note: "${citizenDescription}".

YOUR STRICT MISSION:
Determine whether this photograph ACTUALLY portrays an authentic physical civic infrastructure defect or municipal public grievance in India.

SUPPORTED CIVIC PROBLEM CATEGORIES:
1. 'roadsInfrastructure': Potholes, broken roads, damaged asphalt, caved-in pavement, broken culvert/bridge, highway craters.
2. 'sanitationHealth': Garbage accumulation, overflowing public dumpsters/dustbins, open drains, blocked drainage, sewage overflow, filthy public garbage dumps.
3. 'waterSupply': Broken municipal water pipeline, leaking pipe flooding street, broken public hand pump, broken public water tap, contaminated public tap supply.
4. 'electricity': Hanging or snapped electric wires, sparking transformer, broken streetlight, damaged electricity distribution box, tilted power pole.
5. 'generalPanchayat': Damaged public infrastructure, broken park bench, broken public boundary wall, fallen tree blocking public path, broken community asset.
6. 'policeLawOrder': Damaged public property, vandalism, blocked public road.

STRICT REJECTION RULES (You MUST set isCivicIssue = false, category = 'none'):
1. Anime, cartoons, digital drawings, illustrations, CGI, video game graphics, fictional artwork, wallpapers, banners (e.g. anime characters, animated drawings, imaginary landscapes).
2. AI-generated images, deepfakes, synthetic scenes, computer-rendered images.
3. Non-problem real photos: landscapes, scenery, sea, beaches, mountains, sky, parks without damage, living rooms, bedrooms, portraits, selfies, human faces, crowds, animals, pets, food, cars, documents, papers, book pages, screenshots, memes.
4. If the image does NOT depict an actual municipal broken infrastructure or public civic failure in India (such as a pothole, open garbage dump, leaking water pipeline, snapped electrical wire), set isCivicIssue = false.
5. If the image is too dark, blurry, obscured, or impossible to verify as a civic defect, set isCivicIssue = false and isUncertain = true.

Respond STRICTLY with a valid JSON object without markdown fences, matching this structure:
{
  "isCivicIssue": true | false,
  "category": "roadsInfrastructure" | "sanitationHealth" | "waterSupply" | "electricity" | "generalPanchayat" | "policeLawOrder" | "none",
  "issueTitle": "Short 3-6 word headline (e.g. 'Road Pothole', 'Overflowing Garbage', 'No Civic Problem Detected', 'Anime / Digital Artwork Rejected')",
  "description": "Short factual 1-2 sentence description of what is clearly visible",
  "confidenceScore": 0.95,
  "severity": "low" | "medium" | "high" | "none",
  "uncertaintyOrLimitations": null,
  "isUncertain": false,
  "isAiOrSynthetic": true | false,
  "rejectionReason": null | "Explain clearly why rejected (e.g. 'The uploaded image is an anime / cartoon illustration and does not portray a municipal civic problem.', 'This image portrays personal scenery rather than a civic infrastructure defect.')"
}`;

    const imagePart = {
      inlineData: {
        data: imageBuffer.toString('base64'),
        mimeType
      }
    };

    const result = await model.generateContent([prompt, imagePart]);
    const responseText = result.response.text().trim();
    const cleaned = responseText.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
    const parsed = JSON.parse(cleaned);

    // Validate category key
    let validCategory = parsed.category;
    if (parsed.isCivicIssue && (!validCategory || !DEPARTMENTS[validCategory])) {
      validCategory = 'generalPanchayat';
    } else if (!parsed.isCivicIssue) {
      validCategory = 'none';
    }

    return {
      serviceConfigured: true,
      isCivicIssue: Boolean(parsed.isCivicIssue),
      category: validCategory,
      issueTitle: parsed.issueTitle || (parsed.isCivicIssue ? 'Civic Problem' : 'No Civic Problem Detected'),
      description: parsed.description || 'Analysis completed.',
      confidenceScore: typeof parsed.confidenceScore === 'number' ? parsed.confidenceScore : 0.92,
      severity: parsed.severity || (parsed.isCivicIssue ? 'medium' : 'none'),
      uncertaintyOrLimitations: parsed.uncertaintyOrLimitations || null,
      isUncertain: Boolean(parsed.isUncertain),
      isAiOrSynthetic: Boolean(parsed.isAiOrSynthetic),
      rejectionReason: parsed.rejectionReason || (parsed.isCivicIssue ? null : 'Image does not portray a supported civic infrastructure grievance.')
    };
  }
}

module.exports = new ImageVerificationService();

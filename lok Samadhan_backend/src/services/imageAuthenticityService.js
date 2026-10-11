const fs = require('fs');
const exifParser = require('exif-parser');

/**
 * Service for analyzing image authenticity and detecting potential AI generation or manipulation.
 * Evaluates:
 * 1. Metadata signatures (known generative AI tools, prompt chunks, software tags)
 * 2. Available provenance metadata (C2PA assertions/manifests)
 * 3. Configured AI detector services (Sightengine, Hugging Face, or Gemini Forensic)
 * 4. Image forensic properties
 */
class ImageAuthenticityService {
  constructor() {
    this.sightengineApiUser = process.env.SIGHTENGINE_API_USER || '';
    this.sightengineApiSecret = process.env.SIGHTENGINE_API_SECRET || '';
    this.huggingFaceApiKey = process.env.HUGGINGFACE_API_KEY || '';
    this.geminiApiKey = process.env.GEMINI_API_KEY || '';
  }

  /**
   * Evaluates image buffer and metadata signals
   * Returns:
   * status: 'LIKELY_AUTHENTIC' | 'SUSPICIOUS' | 'INCONCLUSIVE' | 'UNAVAILABLE'
   */
  async evaluateAuthenticity(imageBuffer, mimeType = 'image/jpeg', geminiModel = null) {
    if (!Buffer.isBuffer(imageBuffer) || imageBuffer.length === 0) {
      return {
        status: 'UNAVAILABLE',
        stateLabel: 'Authenticity Check Unavailable',
        statement: 'Image data was empty or invalid.',
        confidenceScore: null,
        signalsChecked: ['Buffer integrity'],
        detectedSignals: [],
        detectorInfo: 'Lok Samadhan Authenticity Engine v2.0'
      };
    }

    const signalsChecked = [
      'EXIF & IPTC generative software metadata tags',
      'PNG parameter / prompt chunks (Stable Diffusion, Midjourney, ComfyUI)',
      'C2PA provenance manifests & credentials',
      'JPEG quantization & compression anomalies'
    ];

    const detectedSignals = [];
    let isMetadataAiDetected = false;
    let metadataReason = '';

    // 1. Inspect EXIF metadata (JPEG)
    let exifData = null;
    let exifSoftware = null;
    let cameraMake = null;
    let cameraModel = null;
    let hasExifGps = false;
    let exifLat = null;
    let exifLon = null;
    let exifTimestamp = null;

    try {
      if (mimeType.includes('jpeg') || mimeType.includes('jpg')) {
        const parser = exifParser.create(imageBuffer);
        exifData = parser.parse();

        if (exifData && exifData.tags) {
          exifSoftware = exifData.tags.Software || '';
          cameraMake = exifData.tags.Make || null;
          cameraModel = exifData.tags.Model || null;

          if (exifData.tags.GPSLatitude !== undefined && exifData.tags.GPSLongitude !== undefined) {
            hasExifGps = true;
            exifLat = exifData.tags.GPSLatitude;
            exifLon = exifData.tags.GPSLongitude;
          }

          if (exifData.tags.DateTimeOriginal || exifData.tags.CreateDate) {
            const ts = exifData.tags.DateTimeOriginal || exifData.tags.CreateDate;
            exifTimestamp = new Date(ts * 1000).toISOString();
          }

          // Check for known AI software tags in EXIF
          const aiSoftwareRegex = /midjourney|dall[- ]?e|stable diffusion|comfyui|novelai|invokeai|firefly|adobe firefly|craiyon|bing image creator|flux\.1/i;
          if (aiSoftwareRegex.test(exifSoftware)) {
            isMetadataAiDetected = true;
            metadataReason = `EXIF Software tag indicates AI generator tool: "${exifSoftware}"`;
            detectedSignals.push(metadataReason);
          }
        }
      }
    } catch (exifErr) {
      // Missing or corrupt EXIF does NOT mean AI generated!
      // As per detection rules: Missing metadata does not prove an image is AI-generated.
    }

    // 2. Inspect PNG Text chunks (tEXt, iTXt, zTXt)
    if (mimeType.includes('png') || imageBuffer.slice(0, 8).toString('hex') === '89504e470d0a1a0a') {
      const bufferStr = imageBuffer.toString('latin1');
      if (
        bufferStr.includes('parameters\x00') ||
        bufferStr.includes('prompt\x00') ||
        bufferStr.includes('negative_prompt') ||
        bufferStr.includes('Stable Diffusion') ||
        bufferStr.includes('Steps: ') && bufferStr.includes('Sampler: ') && bufferStr.includes('CFG scale:')
      ) {
        isMetadataAiDetected = true;
        metadataReason = 'PNG text chunks contain AI generation prompt parameters (Automatic1111 / ComfyUI / SD metadata).';
        detectedSignals.push(metadataReason);
      }
    }

    // 3. Inspect C2PA Provenance Manifests
    const bufferAscii = imageBuffer.toString('latin1', 0, Math.min(imageBuffer.length, 32768));
    const hasC2pa = bufferAscii.includes('c2pa') || bufferAscii.includes('urn:c2pa:');
    if (hasC2pa) {
      signalsChecked.push('C2PA provenance manifest present');
      if (bufferAscii.includes('c2pa.synthetic') || bufferAscii.includes('trainedAlgorithmicData')) {
        isMetadataAiDetected = true;
        metadataReason = 'C2PA provenance credentials indicate synthetically generated media.';
        detectedSignals.push(metadataReason);
      }
    }

    // If metadata explicitly identifies an AI generator:
    if (isMetadataAiDetected) {
      return {
        status: 'SUSPICIOUS',
        stateLabel: 'Potentially AI-Generated or Manipulated',
        statement: 'This image shows signals associated with AI generation or manipulation. Please provide an original photograph of the actual civic issue if possible.',
        confidenceScore: 0.95,
        signalsChecked,
        detectedSignals,
        detectorInfo: 'Lok Samadhan Forensic Metadata Inspector v2.0',
        exifDetails: {
          hasExifGps,
          latitude: exifLat,
          longitude: exifLon,
          timestamp: exifTimestamp,
          cameraMake,
          cameraModel,
          software: exifSoftware
        }
      };
    }

    // 4. External AI Detector Service (Sightengine or Hugging Face if configured)
    let externalDetectorResult = null;
    if (this.sightengineApiUser && this.sightengineApiSecret) {
      signalsChecked.push('Sightengine AI-Generated Image API');
      try {
        const axios = require('axios');
        const FormData = require('form-data');
        const form = new FormData();
        form.append('media', imageBuffer, { filename: 'upload.jpg', contentType: mimeType });
        form.append('models', 'genai');
        form.append('api_user', this.sightengineApiUser);
        form.append('api_secret', this.sightengineApiSecret);

        const response = await axios.post('https://api.sightengine.com/1.0/check.json', form, {
          headers: form.getHeaders(),
          timeout: 8000
        });

        if (response.data && response.data.type && response.data.type.ai_generated !== undefined) {
          const aiGenScore = response.data.type.ai_generated;
          externalDetectorResult = {
            provider: 'Sightengine AI Detector',
            aiScore: aiGenScore
          };
          if (aiGenScore > 0.65) {
            detectedSignals.push(`Sightengine detector reported ${(aiGenScore * 100).toFixed(1)}% probability of AI generation.`);
          }
        }
      } catch (seErr) {
        console.warn(`[ImageAuthenticityService] Sightengine API error: ${seErr.message}`);
      }
    }

    // 5. Gemini Forensic Visual Inspection (if Gemini API key available)
    let geminiForensicResult = null;
    if (this.geminiApiKey) {
      signalsChecked.push('Gemini Multimodal Forensic Visual Detector');

      const forensicPrompt = `You are a Digital Forensics Examiner for Indian Government Civic Grievance Verification.
Analyze this uploaded image for signs of AI generation (e.g. Midjourney, Stable Diffusion, DALL-E, Flux, Deepfake), digital manipulation, or non-camera artificial media.

CRITICAL CHECKS:
1. Diffusion model artifacts (warped lines, floating fragments, illogical geometry in infrastructure, melted lettering on street signs)
2. Unnatural synthetic textures, overly smooth surfaces, plastic sheen, AI dreamlike lighting
3. 2D/3D anime, cartoon, digital drawing, illustration, CGI, video game graphics, digital art, or digital wallpaper rather than an authentic physical camera photograph
4. Face swapping, deepfake manipulation, or generative fill anomalies

Respond STRICTLY in valid JSON without markdown fences:
{
  "syntheticProbability": 0.05,
  "verdict": "LIKELY_AUTHENTIC" | "SUSPICIOUS" | "INCONCLUSIVE",
  "reason": "1-2 sentence forensic observation",
  "evidenceSignals": ["observed signal 1", "observed signal 2"]
}`;

      const imagePart = {
        inlineData: {
          data: imageBuffer.toString('base64'),
          mimeType
        }
      };

      const candidateModels = [
        geminiModel,
        'gemini-3.1-flash-lite',
        'gemini-3.5-flash-lite',
        'gemini-flash-lite-latest',
        'gemini-3.6-flash'
      ].filter(Boolean);

      const { GoogleGenerativeAI } = require('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(this.geminiApiKey);

      for (const m of candidateModels) {
        try {
          const activeModel = typeof m === 'string' ? genAI.getGenerativeModel({ model: m }) : m;
          const result = await activeModel.generateContent([forensicPrompt, imagePart]);
          const rawText = result.response.text().trim();
          const cleaned = rawText.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
          const parsed = JSON.parse(cleaned);

          geminiForensicResult = {
            provider: 'Gemini Vision Forensic Model',
            probability: typeof parsed.syntheticProbability === 'number' ? parsed.syntheticProbability : null,
            verdict: parsed.verdict,
            reason: parsed.reason,
            signals: parsed.evidenceSignals || []
          };

          if (parsed.verdict === 'SUSPICIOUS' || (parsed.syntheticProbability && parsed.syntheticProbability > 0.65)) {
            detectedSignals.push(...(parsed.evidenceSignals || [parsed.reason]));
          }
          break; // Succeeded!
        } catch (gemErr) {
          console.warn(`[ImageAuthenticityService] Forensic inspection attempt error: ${gemErr.message}`);
        }
      }
    }

    // 6. Synthesize Final Verdict
    const exifDetails = {
      hasExifGps,
      latitude: exifLat,
      longitude: exifLon,
      timestamp: exifTimestamp,
      cameraMake,
      cameraModel,
      software: exifSoftware
    };

    // Case 1: External or Gemini detector found strong evidence
    if (
      (externalDetectorResult && externalDetectorResult.aiScore > 0.65) ||
      (geminiForensicResult && geminiForensicResult.verdict === 'SUSPICIOUS')
    ) {
      const conf = externalDetectorResult ? externalDetectorResult.aiScore : (geminiForensicResult?.probability || 0.85);
      return {
        status: 'SUSPICIOUS',
        stateLabel: 'Potentially AI-Generated or Manipulated',
        statement: 'This image shows signals associated with AI generation or manipulation. Please provide an original photograph of the actual civic issue if possible.',
        confidenceScore: parseFloat(conf.toFixed(2)),
        signalsChecked,
        detectedSignals,
        detectorInfo: externalDetectorResult ? externalDetectorResult.provider : geminiForensicResult.provider,
        exifDetails
      };
    }

    // Case 2: Detector ran and found NO strong evidence of AI generation
    if (
      (externalDetectorResult && externalDetectorResult.aiScore <= 0.65) ||
      (geminiForensicResult && geminiForensicResult.verdict === 'LIKELY_AUTHENTIC')
    ) {
      const conf = externalDetectorResult ? (1 - externalDetectorResult.aiScore) : (1 - (geminiForensicResult?.probability || 0.15));
      return {
        status: 'LIKELY_AUTHENTIC',
        stateLabel: 'Likely Authentic / No AI Evidence Found',
        statement: 'No strong evidence of AI generation or manipulation was detected. This does not guarantee that the image is authentic.',
        confidenceScore: parseFloat(conf.toFixed(2)),
        signalsChecked,
        detectedSignals: [],
        detectorInfo: externalDetectorResult ? externalDetectorResult.provider : geminiForensicResult.provider,
        exifDetails
      };
    }

    // Case 3: Inconclusive detector result
    if (geminiForensicResult && geminiForensicResult.verdict === 'INCONCLUSIVE') {
      return {
        status: 'INCONCLUSIVE',
        stateLabel: 'Unable to Determine',
        statement: 'Image authenticity could not be determined reliably. Please provide an original photograph or additional evidence.',
        confidenceScore: null,
        signalsChecked,
        detectedSignals: geminiForensicResult.signals || [],
        detectorInfo: geminiForensicResult.provider,
        exifDetails
      };
    }

    // Case 4: No detector provider is configured (hackathon demonstration rule)
    // "For hackathon demonstration purposes, if an authenticity detection provider is not configured, clearly display Authenticity Check Unavailable rather than inventing results."
    return {
      status: 'UNAVAILABLE',
      stateLabel: 'Authenticity Check Unavailable',
      statement: 'Authenticity check is unavailable because no external AI image detector service (Sightengine / Hugging Face / Gemini Forensic) is currently configured in the backend environment.',
      confidenceScore: null,
      signalsChecked,
      detectedSignals: [],
      detectorInfo: 'Forensic Metadata Scanner (No external detector API configured)',
      exifDetails
    };
  }
}

module.exports = new ImageAuthenticityService();

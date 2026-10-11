const { supabaseClient, inMemoryStore } = require('../config/database');
const { successResponse, errorResponse } = require('../utils/response');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

class AuthController {
  /**
   * POST /api/auth/register
   * Body: { fullName, email, password }
   */
  async register(req, res) {
    try {
      const { fullName, email, password } = req.body;

      // Validation
      if (!fullName || !fullName.trim()) {
        return errorResponse(res, 'Full name is required', 400);
      }
      if (!email || !EMAIL_REGEX.test(email.trim())) {
        return errorResponse(res, 'Please provide a valid email address', 400);
      }
      if (!password || password.length < 6) {
        return errorResponse(res, 'Password must be at least 6 characters long', 400);
      }

      const cleanEmail = email.trim().toLowerCase();
      const cleanName = fullName.trim();

      // 1. Try Supabase Auth if connected
      if (supabaseClient && supabaseClient.auth) {
        try {
          // Attempt admin user creation first to auto-confirm email for immediate login access
          let authUser = null;
          const { data: adminData, error: adminError } = await supabaseClient.auth.admin.createUser({
            email: cleanEmail,
            password,
            email_confirm: true,
            user_metadata: {
              full_name: cleanName,
              name: cleanName,
              role: 'citizen'
            }
          });

          if (!adminError && adminData && adminData.user) {
            authUser = adminData.user;
          } else if (adminError && adminError.message && (adminError.message.includes('already registered') || adminError.message.includes('already exists'))) {
            return errorResponse(res, 'An account with this email address already exists. Please sign in instead.', 400);
          } else {
            // Fallback to standard signUp
            const { data: signUpData, error: signUpError } = await supabaseClient.auth.signUp({
              email: cleanEmail,
              password,
              options: {
                data: {
                  full_name: cleanName,
                  name: cleanName,
                  role: 'citizen'
                }
              }
            });

            if (signUpError) {
              return errorResponse(res, signUpError.message, 400);
            }
            authUser = signUpData.user;
          }

          // Immediately sign in to generate access & refresh tokens
          const { data: sessionData, error: signInError } = await supabaseClient.auth.signInWithPassword({
            email: cleanEmail,
            password
          });

          const token = sessionData?.session?.access_token || `token_ls_${Buffer.from(JSON.stringify({ id: authUser.id, email: cleanEmail })).toString('base64')}`;
          const refreshToken = sessionData?.session?.refresh_token || null;

          const userProfile = {
            id: authUser.id,
            email: cleanEmail,
            name: cleanName,
            role: 'citizen',
            provider: 'supabase'
          };

          return successResponse(res, {
            user: userProfile,
            token,
            refreshToken,
            message: 'Account created successfully'
          }, 'Registration successful', 201);
        } catch (supabaseErr) {
          console.warn(`[AuthController] Supabase registration warning: ${supabaseErr.message}`);
          // Fall through to in-memory if Supabase had network issue
        }
      }

      // 2. High-fidelity in-memory fallback
      let user = inMemoryStore.users.find((u) => u.email === cleanEmail);
      if (user) {
        return errorResponse(res, 'An account with this email address already exists. Please sign in instead.', 400);
      }

      user = {
        id: `CIT-${Math.floor(1000 + Math.random() * 9000)}`,
        name: cleanName,
        email: cleanEmail,
        role: 'citizen',
        district: 'Ahmedabad',
        provider: 'local'
      };
      inMemoryStore.users.push(user);

      const token = `token_ls_${Buffer.from(JSON.stringify({ id: user.id, email: user.email, role: user.role })).toString('base64')}`;

      return successResponse(res, {
        user,
        token,
        message: 'Account registered successfully (local mode)'
      }, 'Registration successful', 201);
    } catch (err) {
      console.error('[AuthController.register] Error:', err);
      return errorResponse(res, err.message, 500);
    }
  }

  /**
   * POST /api/auth/login
   * Supports:
   * 1. Email/Password: { email, password }
   * 2. Phone / Demo: { phone, role = 'citizen' | 'governmentOfficial', name }
   */
  async login(req, res) {
    try {
      const { email, password, phone, role = 'citizen', name } = req.body;

      // --- Option A: Email + Password Authentication ---
      if (email !== undefined) {
        if (!email || !EMAIL_REGEX.test(email.trim())) {
          return errorResponse(res, 'Please enter a valid email address', 400);
        }
        if (!password) {
          return errorResponse(res, 'Password is required', 400);
        }

        const cleanEmail = email.trim().toLowerCase();

        // Check Supabase Auth
        if (supabaseClient && supabaseClient.auth) {
          try {
            const { data, error } = await supabaseClient.auth.signInWithPassword({
              email: cleanEmail,
              password
            });

            if (error) {
              return errorResponse(res, error.message || 'Invalid email or password', 401);
            }

            if (data && data.user && data.session) {
              const fullName = data.user.user_metadata?.full_name || 
                               data.user.user_metadata?.name || 
                               cleanEmail.split('@')[0];

              const userProfile = {
                id: data.user.id,
                email: data.user.email,
                name: fullName,
                role: data.user.user_metadata?.role || 'citizen',
                provider: 'supabase'
              };

              return successResponse(res, {
                user: userProfile,
                token: data.session.access_token,
                refreshToken: data.session.refresh_token,
                message: 'Authentication successful'
              });
            }
          } catch (supabaseErr) {
            console.warn(`[AuthController] Supabase login error: ${supabaseErr.message}`);
          }
        }

        // In-Memory store fallback
        const existing = inMemoryStore.users.find((u) => u.email === cleanEmail);
        if (existing) {
          const token = `token_ls_${Buffer.from(JSON.stringify({ id: existing.id, email: existing.email, role: existing.role })).toString('base64')}`;
          return successResponse(res, {
            user: existing,
            token,
            message: 'Authentication successful (local)'
          });
        }

        // Demo fallback for test users
        const demoUser = {
          id: `CIT-${Math.floor(1000 + Math.random() * 9000)}`,
          email: cleanEmail,
          name: cleanEmail.split('@')[0],
          role: 'citizen',
          provider: 'local'
        };
        inMemoryStore.users.push(demoUser);
        const token = `token_ls_${Buffer.from(JSON.stringify({ id: demoUser.id, email: demoUser.email })).toString('base64')}`;
        return successResponse(res, {
          user: demoUser,
          token,
          message: 'Authentication successful'
        });
      }

      // --- Option B: Phone-based Authentication / Demo Persona ---
      if (!phone) {
        return errorResponse(res, 'Email address or phone number is required for authentication', 400);
      }

      let user = inMemoryStore.users.find((u) => u.phone === phone);

      if (!user) {
        user = {
          id: role === 'governmentOfficial' ? `OFF-${Math.floor(100 + Math.random() * 900)}` : `CIT-${Math.floor(1000 + Math.random() * 9000)}`,
          phone,
          name: name || (role === 'governmentOfficial' ? 'Nodal Grievance Officer' : 'Nagarik Citizen'),
          role,
          district: 'Ahmedabad',
          provider: 'phone'
        };
        inMemoryStore.users.push(user);
      }

      const token = `token_ls_${Buffer.from(JSON.stringify({ id: user.id, role: user.role })).toString('base64')}`;

      return successResponse(res, {
        user,
        token,
        message: 'Authentication successful'
      });
    } catch (err) {
      console.error('[AuthController.login] Error:', err);
      return errorResponse(res, err.message, 500);
    }
  }

  /**
   * GET /api/auth/google-url
   * Generates Supabase Google OAuth authorization URL
   */
  async getGoogleOAuthUrl(req, res) {
    try {
      const redirectTo = req.query.redirectTo || 'http://localhost:8088';

      if (supabaseClient && supabaseClient.auth) {
        const { data, error } = await supabaseClient.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo,
            queryParams: {
              access_type: 'offline',
              prompt: 'select_account'
            }
          }
        });

        if (error) {
          return errorResponse(res, error.message, 500);
        }

        if (!data || !data.url) {
          return errorResponse(res, 'Failed to generate Google OAuth authorization URL from Supabase.', 500);
        }

        return successResponse(res, {
          url: data.url,
          provider: 'google',
          redirectTo
        }, 'Google OAuth URL generated successfully');
      }

      return errorResponse(res, 'Supabase authentication service is not configured. Please check SUPABASE_URL and SUPABASE_ANON_KEY in server environment.', 503);
    } catch (err) {
      return errorResponse(res, err.message, 500);
    }
  }

  /**
   * POST /api/auth/exchange-code
   * Exchanges authorization code from Supabase OAuth redirect for session
   */
  async exchangeAuthCode(req, res) {
    try {
      const { code } = req.body;
      if (!code) {
        return errorResponse(res, 'Authorization code is required', 400);
      }

      if (supabaseClient && supabaseClient.auth) {
        const { data, error } = await supabaseClient.auth.exchangeCodeForSession(code);
        if (error || !data || !data.session) {
          return errorResponse(res, error?.message || 'Failed to exchange authorization code with Supabase', 401);
        }

        const user = data.user;
        const fullName = user.user_metadata?.full_name || user.user_metadata?.name || user.email.split('@')[0];
        const userProfile = {
          id: user.id,
          email: user.email,
          name: fullName,
          avatarUrl: user.user_metadata?.avatar_url || null,
          role: 'citizen',
          provider: 'google'
        };

        return successResponse(res, {
          user: userProfile,
          token: data.session.access_token,
          refreshToken: data.session.refresh_token,
          message: 'Google authentication verified'
        });
      }

      return errorResponse(res, 'Authentication service not available', 503);
    } catch (err) {
      return errorResponse(res, err.message, 500);
    }
  }

  /**
   * POST /api/auth/google-verify
   * Verifies access token from Google OAuth redirect or client token
   */
  async googleVerify(req, res) {
    try {
      const { accessToken } = req.body;
      if (!accessToken) {
        return errorResponse(res, 'Access token is required', 400);
      }

      if (supabaseClient && supabaseClient.auth) {
        const { data: { user }, error } = await supabaseClient.auth.getUser(accessToken);
        if (error || !user) {
          return errorResponse(res, error?.message || 'Invalid Google authentication session', 401);
        }

        const fullName = user.user_metadata?.full_name || user.user_metadata?.name || user.email.split('@')[0];
        const userProfile = {
          id: user.id,
          email: user.email,
          name: fullName,
          avatarUrl: user.user_metadata?.avatar_url || null,
          role: 'citizen',
          provider: 'google'
        };

        return successResponse(res, {
          user: userProfile,
          token: accessToken,
          message: 'Google authentication verified'
        });
      }

      return errorResponse(res, 'Authentication service not available', 503);
    } catch (err) {
      return errorResponse(res, err.message, 500);
    }
  }

  /**
   * POST /api/auth/forgot-password
   * Body: { email }
   */
  async forgotPassword(req, res) {
    try {
      const { email } = req.body;
      if (!email || !EMAIL_REGEX.test(email.trim())) {
        return errorResponse(res, 'Please provide a valid registered email address', 400);
      }

      const cleanEmail = email.trim().toLowerCase();

      if (supabaseClient && supabaseClient.auth) {
        try {
          await supabaseClient.auth.resetPasswordForEmail(cleanEmail, {
            redirectTo: 'http://localhost:8088/#/reset-password'
          });
        } catch (supabaseErr) {
          console.warn(`[AuthController.forgotPassword] Warning: ${supabaseErr.message}`);
        }
      }

      return successResponse(res, {
        email: cleanEmail
      }, 'If an account exists for this email, password reset instructions have been dispatched.');
    } catch (err) {
      return errorResponse(res, err.message, 500);
    }
  }

  /**
   * GET /api/auth/me
   * Validates active bearer token and returns current user info
   */
  async getCurrentUser(req, res) {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return errorResponse(res, 'Bearer token is required', 401);
      }

      const token = authHeader.split(' ')[1];

      if (supabaseClient && supabaseClient.auth) {
        const { data: { user }, error } = await supabaseClient.auth.getUser(token);
        if (!error && user) {
          const fullName = user.user_metadata?.full_name || user.user_metadata?.name || user.email.split('@')[0];
          return successResponse(res, {
            user: {
              id: user.id,
              email: user.email,
              name: fullName,
              role: user.user_metadata?.role || 'citizen',
              provider: user.app_metadata?.provider || 'supabase'
            }
          });
        }
      }

      // Check in-memory store
      if (token.startsWith('token_ls_')) {
        try {
          const payload = JSON.parse(Buffer.from(token.replace('token_ls_', ''), 'base64').toString('utf8'));
          const user = inMemoryStore.users.find((u) => u.id === payload.id);
          if (user) {
            return successResponse(res, { user });
          }
        } catch (e) {
          // ignore
        }
      }

      return errorResponse(res, 'Session expired or invalid', 401);
    } catch (err) {
      return errorResponse(res, err.message, 500);
    }
  }

  /**
   * POST /api/auth/logout
   */
  async logout(req, res) {
    try {
      if (supabaseClient && supabaseClient.auth) {
        try {
          await supabaseClient.auth.signOut();
        } catch (e) {
          // ignore
        }
      }
      return successResponse(res, null, 'Logged out successfully');
    } catch (err) {
      return errorResponse(res, err.message, 500);
    }
  }

  /**
   * GET /api/auth/demo-accounts
   */
  getDemoAccounts(req, res) {
    return successResponse(res, [
      {
        role: 'citizen',
        name: 'Hasmukhbhai Patel',
        email: 'hasmukh.patel@example.gov.in',
        phone: '+91 98250 12345',
        description: 'Citizen Persona: Can lodge complaints, upload voice notes, track SLA'
      },
      {
        role: 'governmentOfficial',
        name: 'Rajesh Solanki (Junior Engineer PHED)',
        email: 'rajesh.solanki@gujarat.gov.in',
        phone: '+91 98250 99999',
        departmentCategory: 'waterSupply',
        description: 'Officer Persona: Can triage complaints, inspect sites, resolve grievances'
      },
      {
        role: 'admin',
        name: 'District Magistrate / Chief Admin',
        email: 'admin.collector@gujarat.gov.in',
        phone: '+91 90000 00000',
        description: 'Admin Persona: Full administrative authority, SLA escalation override'
      }
    ], 'Demo accounts list for instant testing');
  }
}

module.exports = new AuthController();


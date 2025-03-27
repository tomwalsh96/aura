/**
 * Google Cloud Speech-to-Text API Configuration
 * 
 * To use the Google Cloud Speech-to-Text API:
 * 
 * 1. Visit https://console.cloud.google.com/ and create a new project
 * 2. Enable the Speech-to-Text API for your project
 * 3. Create an API key in the "APIs & Services" > "Credentials" section
 * 4. Add your API key to the .env file as GOOGLE_CLOUD_SPEECH_TO_TEXT_API_KEY
 * 5. Consider securing your API key with API restrictions in the Google Cloud Console
 * 
 * Note: Google Cloud may charge for usage beyond the free tier.
 * Check pricing at: https://cloud.google.com/speech-to-text/pricing
 */

import { GOOGLE_CLOUD_SPEECH_TO_TEXT_API_KEY } from '@env';

// External API configuration
export const GOOGLE_CLOUD_API_KEY = GOOGLE_CLOUD_SPEECH_TO_TEXT_API_KEY || 'YOUR_API_KEY_HERE';

// API endpoints
export const GOOGLE_SPEECH_API_ENDPOINT = 'https://speech.googleapis.com/v1/speech:recognize';
export const GOOGLE_SPEECH_STREAM_API_ENDPOINT = 'https://speech.googleapis.com/v1p1beta1/speech:recognize';

// Other config values
export const STREAM_INTERVAL_MS = 3000; // How often to send audio data (3 seconds) 
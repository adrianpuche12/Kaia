/**
 * Simple TTS test script (standalone, no database required)
 */

const fs = require('fs');
const path = require('path');

// Set environment variables
process.env.ELEVENLABS_API_KEY = 'sk_875e53bb8c8cf2ec50f673dc9c837ba5db0b8c29804e13c5';
process.env.ELEVENLABS_VOICE_ID = 'EXAVITQu4vr4xnSDxMaL';
process.env.ELEVENLABS_MODEL_ID = 'eleven_multilingual_v2';
process.env.TTS_PROVIDER = 'elevenlabs';
process.env.TTS_FALLBACK_ENABLED = 'true';

// Import the ElevenLabs SDK
const { ElevenLabsClient } = require('elevenlabs');

async function testElevenLabsTTS() {
  console.log('🧪 Testing ElevenLabs TTS integration...\n');

  try {
    const client = new ElevenLabsClient({
      apiKey: process.env.ELEVENLABS_API_KEY
    });

    console.log('📝 Text to convert: "Hola, soy Kaia, tu asistente personal. Probando la nueva voz con ElevenLabs."');

    const audio = await client.generate({
      voice: process.env.ELEVENLABS_VOICE_ID,
      text: 'Hola, soy Kaia, tu asistente personal. Probando la nueva voz con ElevenLabs.',
      model_id: process.env.ELEVENLABS_MODEL_ID,
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
      },
    });

    // Convert stream to buffer
    const chunks = [];
    for await (const chunk of audio) {
      chunks.push(Buffer.from(chunk));
    }
    const audioBuffer = Buffer.concat(chunks);

    // Save to file
    const outputPath = path.join(__dirname, 'test-output.mp3');
    fs.writeFileSync(outputPath, audioBuffer);

    console.log('\n✅ Success!');
    console.log(`📊 Audio size: ${(audioBuffer.length / 1024).toFixed(2)} KB`);
    console.log(`💾 Saved to: ${outputPath}`);
    console.log('\n🎵 You can now play test-output.mp3 to hear the voice!');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.statusCode) {
      console.error(`   Status code: ${error.statusCode}`);
    }
    process.exit(1);
  }
}

testElevenLabsTTS();

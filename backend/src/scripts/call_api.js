import { GoogleGenAI } from '@google/genai';
import wav from 'wav';
import { writeFile } from 'fs/promises';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Helpers
async function saveWaveFile(
  filename,
  pcmData,
  channels = 1,
  rate = 24000,
  sampleWidth = 2,
) {
  return new Promise((resolve, reject) => {
    const writer = new wav.FileWriter(filename, {
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    writer.on('finish', resolve);
    writer.on('error', reject);

    writer.write(pcmData);
    writer.end();
  });
}

async function saveJsonFile(filename, jsonData) {
  await writeFile(filename, JSON.stringify(jsonData, null, 2));
  console.log(`JSON file saved to ${filename}`)
}

async function saveTextFile(filename, textData) {
  await writeFile(filename, textData);
  console.log(`TXT file saved to ${filename}`)
}

// Get speech
async function main(gen_ai, model, voice, style, text, filename) {

  let modelFullName;

  if (model === 'flash') {
    modelFullName = 'gemini-2.5-flash-preview-tts';
  }
  else if (model === 'pro') {
    modelFullName = 'gemini-2.5-pro-preview-tts';
  }
  else {
    throw new RangeError(`Model name unknown: ${model}`)
  }

  const fullPrompt = style + '\n\n' + text;

  let response;

  try {
    response = await gen_ai.models.generateContent({
      model: modelFullName,
      contents: [{ parts: [{ text: fullPrompt }] }],
      config: {
        temperature: 1,
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice },
          },
        },
      },
    });
  }
  catch (error) {
    console.error(error);
    const msg = JSON.parse(error.message).error;
    return {
      error: { code: msg.code, status: msg.status, message: msg.message }
    }
  }

  await saveTextFile(`../files/${filename}.txt`, fullPrompt);
  await saveJsonFile(`../files/${filename}.json`, response);
  const data = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  const audioBuffer = Buffer.from(data, 'base64');
  await saveWaveFile(`../files/${filename}.wav`, audioBuffer);
}

// Testing
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
const model = 'pro';
const voice = 'Orus';
const style = 'Přečti básnickým hlasem jako starý panovník';
const text = 'Vidím v dáli jezdce na koni,\nsnad to tady pěkně pokoní.\nSkáče tady sem a tam,\njistě ho pak pokárám.';
const filename = 'test';

const res = await main(ai, model, voice, style, text, filename);
console.log(res);
console.log("Done");
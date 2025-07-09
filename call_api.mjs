import {GoogleGenAI} from '@google/genai';
import wav from 'wav';
import { writeFile } from 'fs/promises';

const GEMINI_API_KEY = 'xxx'

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

   const response = await gen_ai.models.generateContent({
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

   await saveTextFile(`files/${filename}.txt`, fullPrompt);
   await saveJsonFile(`files/${filename}.json`, response);
   const data = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
   const audioBuffer = Buffer.from(data, 'base64');
   await saveWaveFile(`files/${filename}.wav`, audioBuffer);
}

// Testing
const ai = new GoogleGenAI({apiKey: GEMINI_API_KEY});
const model = 'flash';
const voice = 'Orus';
const style = 'Přečti básnickým hlasem jako starý panovník';
const text = 'Vidím v dáli jezdce na koni,\nsnad to tady pěkně pokoní. Skáče tady sem a tam,\njistě ho pak pokárám.';
const filename = 'test';

await main(ai, model, voice, style, text, filename);
console.log("Done");
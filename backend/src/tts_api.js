import { GoogleGenAI } from '@google/genai';

import { getWavBuffer, getWavDuration } from './wav_helpers.js'


export class TtsApi {
    constructor(apiKey) {
        this.ai = new GoogleGenAI({ apiKey: apiKey });
    }

    async getSpeech({ model, voiceName, temperature, style, text }) {
        // Choose model 
        let modelFullName;
        if (model === 'basic') {
            modelFullName = 'gemini-2.5-flash-preview-tts';
        }
        else if (model === 'advanced') {
            modelFullName = 'gemini-2.5-pro-preview-tts';
        }
        else {
            throw new RangeError(`Model name unknown: ${model}`)
        }

        // Create prompt
        const fullPrompt = style + '\n\n' + text;

        // Generate audio
        const gen_start_ts = Date.now();
        let response;
        try {
            response = await this.ai.models.generateContent({
                model: modelFullName,
                contents: [{ parts: [{ text: fullPrompt }] }],
                config: {
                    temperature: temperature,
                    responseModalities: ['AUDIO'],
                    speechConfig: {
                        voiceConfig: {
                            prebuiltVoiceConfig: { voiceName: voiceName },
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
        const gen_end_ts = Date.now();

        console.log(response);

        // Check for prohibited content
        const blockReason = response.promptFeedback?.blockReason;
        if (blockReason) {
            return { error: { status: blockReason, code: 403 } };
        }

        const finishReason = response.candidates?.[0].finishReason;
        if (finishReason) {
            return { error: { status: finishReason, code: 403 } };
        }

        // Parse audio data
        let audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        audioData = Buffer.from(audioData, 'base64');   // PCM
        audioData = await getWavBuffer(audioData);
        const audioDuration = getWavDuration(audioData);

        // Parse metadata
        const rawUsageData = response.usageMetadata;
        const genDuration = (gen_end_ts - gen_start_ts) / 1000;
        const metadata = {
            inputTokenCount: rawUsageData.promptTokenCount,
            outputTokenCount: rawUsageData.candidatesTokenCount,
            audioDuration: Math.round(audioDuration),
            generationDuration: Math.round(genDuration)
        }

        // Return both
        audioData = audioData.toString('base64');
        return {
            metadata: metadata,
            wavData: audioData
        }
    }
}

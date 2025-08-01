import { randomUUID } from 'crypto';

import { VOICER_BUCKET, FILES_PATH, CONVERTER_API_URL } from "./settings.js";

import { binaryStreamToBuffer } from './helpers.js';
import { convertToLossy } from './convert.js';


export class AudioSaver {
    constructor(audioDbModel, s3Client) {
        this.audioDbModel = audioDbModel;
        this.s3Client = s3Client;
    }

    async #convertToLossy(fileUuid, wavData, targetFormat) {
        // Get data
        console.debug('convertToLossy.start', targetFormat);
        const lossyBuffer = await convertToLossy(CONVERTER_API_URL, wavData, targetFormat)
        // Save data
        const filePath = `/${FILES_PATH}/${fileUuid}.${targetFormat}`;
        await this.s3Client.putObject(VOICER_BUCKET, filePath, lossyBuffer);
        console.log(`Audio file uploaded to S3: ${filePath}`);
        return filePath;
    }

    async saveNew(generationInputs, generatedMetadata, generatedWav) {
        // Create DB object
        const fileUuid = randomUUID();
        const _args = {
            uuid: fileUuid,
            model: generationInputs.model,
            voiceName: generationInputs.voiceName,
            temperature: generationInputs.temperature,
            title: generationInputs.title,
            style: generationInputs.style,
            text: generationInputs.text,
            inputTokenCount: generatedMetadata.inputTokenCount,
            outputTokenCount: generatedMetadata.outputTokenCount,
            audioDuration: generatedMetadata.audioDuration,
            generationDuration: generatedMetadata.generationDuration,
        }
        const audioRow = this.audioDbModel.build(_args);

        // Save sound data to object storage
        const decodedWav = Buffer.from(generatedWav, 'base64');
        const filePath = `/${FILES_PATH}/${fileUuid}.wav`;
        await this.s3Client.putObject(VOICER_BUCKET, filePath, decodedWav);
        console.log(`audio file uploaded to s3: ${filePath}`);
        audioRow.wavFilePath = filePath;

        // Encode to lossy formats
        audioRow.mp3FilePath = await this.#convertToLossy(fileUuid, decodedWav, 'mp3');
        audioRow.oggFilePath = await this.#convertToLossy(fileUuid, decodedWav, 'ogg');

        // If upload worked, save to DB
        await audioRow.save();
        console.log("audio saved to db");

        return {
            audioId: audioRow.id
        }
    }

    async getAll() {
        const audios = this.audioDbModel.findAll({
            order: [['id', 'DESC']]
        })
        return audios;
    }

    async delete(audioId) {
        // Get data
        const audio = await this.audioDbModel.findByPk(audioId);
        if (!audio) {
            return { error: { msg: `audio with ID ${audioId} not found`, code: 404 } }
        }
        // Remove from object storage
        const wavFilePath = audio.wavFilePath;
        await this.s3Client.removeObject(VOICER_BUCKET, wavFilePath);
        // If worked, remove from DB
        await audio.destroy();
        return {};
    }

    async getSound(filePath) {
        let soundStream;
        try {
            soundStream = await this.s3Client.getObject(VOICER_BUCKET, filePath);
        }
        catch (error) {
            console.error(error);
            return { error: { msg: `could not get ${filePath}`, code: 404 } }
        }
        return { soundData: await binaryStreamToBuffer(soundStream) };
    }

    async get(audioId) {
        const audio = await this.audioDbModel.findByPk(audioId);
        if (!audio) {
            return { error: { msg: `audio with ID ${audioId} not found`, code: 404 } }
        }
        return audio;
    }
}

import { randomUUID } from 'crypto';

import { VOICER_BUCKET, FILES_PATH } from "./settings.js";

export class AudioSaver {
    constructor(audioDbModel, s3Client) {
        this.audioDbModel = audioDbModel;
        this.s3Client = s3Client;
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

        // If upload worked, save to DB
        await audioRow.save();
        console.log("audio saved to db");

        return {
            audioId: audioRow.id
        }
    }
}

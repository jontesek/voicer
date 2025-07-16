export class AudioSaver {
    constructor(audioDbModel, s3Conn) {
        this.audioDbModel = audioDbModel;
        this.s3Conn = s3Conn;
    }

    async saveNew(generationInputs, generatedMetadata, generatedWav) {
        const _args = {
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
        await audioRow.save();

        return {
            audioId: audioRow.id
        }
    }
}

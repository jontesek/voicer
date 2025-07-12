

export class AudioSaver {
    constructor(dbConn, s3Conn) {
        this.dbConn = dbConn;
        this.s3Conn = s3Conn;
    }

    async saveAudio(generationInputs, generatedWav, generatedMetadata) {
        return {
            audioId: 1
        }
    }
}

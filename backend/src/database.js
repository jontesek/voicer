import { Sequelize, DataTypes } from 'sequelize';

// Methods
export function getDbConnection(filePath) {
    return new Sequelize({
        dialect: 'sqlite',
        storage: filePath
    })
}

// Models
export function defineAudioModel(dbConn) {
    return dbConn.define('Audio', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        uuid: {
            type: DataTypes.STRING,
            unique: true,
        },
        model: DataTypes.STRING,
        voiceName: DataTypes.STRING,
        temperature: DataTypes.FLOAT,
        title: DataTypes.TEXT,
        style: DataTypes.TEXT,
        text: DataTypes.TEXT,
        inputTokenCount: DataTypes.SMALLINT,
        outputTokenCount: DataTypes.SMALLINT,
        audioDuration: DataTypes.SMALLINT,
        generationDuration: DataTypes.SMALLINT,
        wavFilePath: DataTypes.STRING,
        mp3FilePath: DataTypes.STRING,
        oggFilePath: DataTypes.STRING,
    }, { freezeTableName: true });
}

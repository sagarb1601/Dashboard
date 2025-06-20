import { Model, DataTypes, InferAttributes, InferCreationAttributes } from 'sequelize';
import sequelize from '../config/database';

interface TalkAttributes {
  id: number;
  speaker_name: string;
  topic_role: string;
  event_name: string;
  venue: string;
  talk_date: Date;
  created_at?: Date;
  updated_at?: Date;
}

class Talk extends Model<InferAttributes<Talk>, InferCreationAttributes<Talk>> implements TalkAttributes {
  declare id: number;
  declare speaker_name: string;
  declare topic_role: string;
  declare event_name: string;
  declare venue: string;
  declare talk_date: Date;
  declare created_at: Date;
  declare updated_at: Date;
}

Talk.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    speaker_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    topic_role: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    event_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    venue: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    talk_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'Talk',
    tableName: 'talks',
    timestamps: true,
    underscored: true,
  }
);

export default Talk; 
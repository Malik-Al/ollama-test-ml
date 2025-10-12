import { IsNumberString, IsString } from 'class-validator';

export class ChatDto {
    @IsString()
    question: string;

    @IsNumberString({}, { message: 'bank_id must contain only numbers.' })
    bank_id: string;
}
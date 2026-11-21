import { Injectable } from "@nestjs/common";
import { BadRequestException } from "@nestjs/common";

@Injectable()
export class ScraperService {
    async scrape(url: string){
        let response: Response
        try {
            response = await fetch(url);
        } 
        catch {
            throw new BadRequestException('Could not reach that URL');
        }

        return response.text();
    }
}

import { Body, Controller, Post } from "@nestjs/common";
import { ScraperService } from "./scraper.service.js";

@Controller('scraper')
export class ScraperController {

    constructor(private readonly scraperService: ScraperService) {}

    @Post('aldi')
    scrape(@Body() body: { pages: number}) {
        return this.scraperService.scrapeAldi(body.pages);
    }

}
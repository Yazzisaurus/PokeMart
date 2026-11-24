import { Body, Controller, Post } from "@nestjs/common";
import { ScraperService } from "./scraper.service.js";

@Controller('scraper')
export class ScraperController {

    constructor(private readonly scraperService: ScraperService) {}

    @Post('aldi')
    scrape(@Body() body: { category: string}) {
        return this.scraperService.scrapeAldi(body.category);
    }
}
import { Body, Controller, Post } from "@nestjs/common";
import { ScraperService } from "./scraper.service.js";

@Controller('scraper')
export class ScraperController {

    constructor(private readonly scraperService: ScraperService) {}

    @Post('aldi')
    scrape(@Body() body: { url: string}) {
        //return this.scraperService.scrape(body.url)
        return this.scraperService.scrape("https://www.aldi.ie/products/fresh-food/k/1588161416978075")
    }

}
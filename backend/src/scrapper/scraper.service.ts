import { Injectable } from "@nestjs/common";
import { BadRequestException } from "@nestjs/common";
import { JSDOM } from "jsdom";

@Injectable()
export class ScraperService {

    async scrapeAldi(url: string){

        const html = await this.getHTML(url);
        
        const dom = new JSDOM(html, { url });
        const doc = dom.window.document;
        const grid = doc.querySelector(".product-grid");
        let items: Element[] = [];
        let names: string[] = [];
        if (grid) {
            items = Array.from(grid.children);
            for (let index = 0; index < items.length; index++) {
                let productName = items[index].querySelector(".product-tile a .product-tile__name p")?.textContent?.trim()
                let productPrice = items[index].querySelector(".product-tile a .base-price .base-price__regular")?.textContent?.trim()
                let productPriceDiscount = items[index].querySelector(".product-tile a .base-price .base-price__regular .base-price__discounted")?.textContent?.trim()
                console.log(productName + " " + productPrice + " " + productPriceDiscount)
            }
        }
        
        dom.window.close();

        return grid;

    }


    async getHTML(url: string) {

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

import { Injectable } from "@nestjs/common";
import { BadRequestException } from "@nestjs/common";
import { JSDOM } from "jsdom";

@Injectable()
export class ScraperService {

    async scrapeAldi(pages: number){

        const urlAldi = "https://www.aldi.ie/products/fresh-food/k/1588161416978075?page="

        let names: string[] = [];
        let prices: string[] = [];
        let priceWeight: string[] = [];

        for (let page = 1; page <= pages; page++) {
            let html = await this.getHTML(urlAldi + page);

            let dom = new JSDOM(html);
            let doc = dom.window.document;
            let grid = doc.querySelector(".product-grid");

            let items: Element[] = [];

            if (grid) {

                items = Array.from(grid.children);

                for (let index = 0; index < items.length; index++) {

                    let productName = items[index].querySelector(".product-tile a .product-tile__name p")?.textContent?.trim();
                    let productPrice = items[index].querySelector(".product-tile a .base-price .base-price__regular")?.textContent?.trim();
                    let productPriceDiscount = items[index].querySelector(".product-tile a .base-price .base-price__regular .base-price__discounted")?.textContent?.trim();
                    let productPriceWeight = items[index].querySelector(".product-tile a .product-tile__selling-size-and-comparison .product-tile__comparison-price")?.textContent?.trim();

                    productPriceWeight = productPriceWeight?.substring(0, productPriceWeight.length-1)
                    productPriceWeight = productPriceWeight?.substring(1, productPriceWeight.length)

                    if(productName) {
                        names.push(productName);

                        if(productPriceDiscount) {
                            prices.push(productPriceDiscount);
                        }
                        else if (productPrice) {
                            prices.push(productPrice);
                        }
                        if(productPriceWeight) {
                            priceWeight.push(productPriceWeight);
                        }
                    }
                }
            }
            dom.window.close();
        }
        return [names, prices, priceWeight];
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

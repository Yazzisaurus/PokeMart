import { Injectable } from "@nestjs/common";
import { BadRequestException } from "@nestjs/common";
import { JSDOM } from "jsdom";

@Injectable()
export class ScraperService {

    async scrapeAldi(category: string){

        const urlAldi = "https://www.aldi.ie/products/"
        let url = ""

        switch (category) {
            case "freshFood":
                url = urlAldi + "fresh-food/k/1588161416978075?page="
                break;
            case "foodCupboard":
                url = urlAldi + "food-cupboard/k/1588161416978078?page="
                break;
            case "chilledFood":
                url = urlAldi + "chilled-food/k/1588161416978076?page="
                break;
            case "alcohol":
                url = urlAldi + "alcohol/k/1588161416978080?page="
                break;
            case "drinks":
                url = urlAldi + "drinks/k/1588161416978079?page="
                break;
            case "homeEssentials":
                url = urlAldi + "home-essentials/k/1588161416978084?page="
                break;
            case "bakery":
                url = urlAldi + "bakery/k/1588161416978074?page="
                break;
            case "healthBauty":
                url = urlAldi + "health-beauty/k/1588161416978083?page="
                break;
            case "babyToodler":
                url = urlAldi + "baby-toddler/k/1588161416978082?page="
                break;
            case "petCare":
                url = urlAldi + "pet-care/k/1588161416978085?page="
                break;
            case "vegetarianPlant":
                url = urlAldi + "vegetarian-plant-based/k/1588161421881175?page="
                break;
            case "highProtein":
                url = urlAldi + "higher-protein-food-drink/k/1588161424510128?page="
                break;
            case "savers":
                url = urlAldi + "savers/k/1588161433155116?page="
                break;
            case "autunm":
                url = urlAldi + "autumn-range/k/1588161426780064?page="
                break;
            case "christmas":
                url = urlAldi + "christmas-new-year/k/1588161427774146?page="
                break;
            case "speciallySelected":
                url = urlAldi + "specially-selected/k/1588161431580090?page="
                break;
            default:
                throw new BadRequestException('Could not reach that URL');
                break;
        }


        let html = await this.getHTML(url);
        let dom = new JSDOM(html);
        let doc = dom.window.document;
        let maxPage = 1;
        let pagination = doc.querySelectorAll(".base-pagination :nth-last-child(2 of a)");
        if(pagination) {
            maxPage = Number(pagination[0]?.textContent?.trim());
        }

        let names: string[] = [];
        let prices: string[] = [];
        let priceWeight: string[] = [];

        for (let page = 1; page <= maxPage; page++) {
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

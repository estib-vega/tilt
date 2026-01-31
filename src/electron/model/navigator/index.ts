import { BrowserWindow, app } from 'electron';
import * as cheerio from 'cheerio';
import pie from './pupeteer.js';
import type { Browser, Frame, Page } from 'puppeteer-core';
import puppeteer from 'puppeteer-core';

const DEV_TOOLS_PORT = 9222;

export default class Navigator {
  private static instance: Navigator | undefined;
  private window: BrowserWindow | null = null;
  private browser: Browser | null = null;

  private constructor() {
    pie.initialize(app, DEV_TOOLS_PORT);
  }

  public static getInstance(): Navigator {
    if (!Navigator.instance) {
      Navigator.instance = new Navigator();
    }
    return Navigator.instance;
  }

  destroy(): void {
    Navigator.instance = undefined;
    if (this.window && !this.window.isDestroyed()) {
      this.window.destroy();
    }
    this.window = null;
  }

  async getSearchResults(query: string): Promise<SearchResult[]> {
    console.log('Starting search for query:', query);
    const url = EcosiaPage.urlFromQuery(query);
    const page = await this.getPage(url);
    console.log('Navigated to search URL:', url);
    if (!page) {
      console.error('Failed to retrieve page for URL:', url);
      return [];
    }
    await page.waitForNetworkIdle();
    console.log('Network is idle, proceeding to extract search results.');

    const ecosiaPage = new EcosiaPage(page);
    return ecosiaPage.getResults();
  }

  async getContentFromUrl(url: string): Promise<WebPageContents | null> {
    try {
      const html = await fetch(url).then((res) => res.text());
      const $ = cheerio.load(html);

      const content = new Set<string>();

      $('article').each((_, elem) => {
        content.add($(elem).text());
      });

      $('main').each((_, elem) => {
        content.add($(elem).text());
      });

      $('p').each((_, elem) => {
        content.add($(elem).text());
      });

      const title = $('head > title').text().trim() || url;

      const contentArray = Array.from(content).filter((text) => text.trim().length > 0);
      const text = contentArray.join('\n\n').replace(/\s+/g, ' ').trim();

      // Search for explicit <link> tags
      const iconLinks = $('link[rel="icon"], link[rel="shortcut icon"], link[rel*="icon"]');
      let icon: string | null = null;

      if (iconLinks.length) {
        const href = iconLinks.first().attr('href')?.trim();
        // Resolve relative URLs
        if (href) {
          icon = new URL(href, url).href;
        }
      }

      return {
        title,
        url,
        icon,
        text,
      };
    } catch (error) {
      console.error('Error extracting text content:', error);
      return null;
    }
  }

  private async getPage(url: string) {
    try {
      const browser = await this.getOrCreateBrowser();
      const window = this.getOrCreateWindow();

      await window.loadURL(url);

      return pie.getPage(browser, window);
    } catch (error) {
      console.error('Scrape error:', error);
      return null;
    }
  }

  private async getOrCreateBrowser(): Promise<Browser> {
    if (this.browser) {
      return this.browser;
    }

    this.browser = await pie.connect(app, puppeteer);
    return this.browser;
  }

  private getOrCreateWindow(): BrowserWindow {
    if (this.window && !this.window.isDestroyed()) {
      return this.window;
    }

    this.window = new BrowserWindow({
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
      },
    });

    this.window.on('closed', () => {
      this.window = null;
    });

    return this.window;
  }
}

enum EcosiaLocators {
  Mainline = '[data-test-id="mainline"]',
  MainlineResultAd = '[data-test-id="mainline-result-ad"]',
  MainlineResultWeb = '[data-test-id="mainline-result-web"]',
  MainlineResultWebLink = '[data-test-id="result-link"]',
  Sidebar = '[data-test-id="sidebar"]',
  SidebarEntityLinkWiki = '[data-test-id="entity-links-icon-wikipedia"]',
}

const AD_FRAME_TITLE = 'Ads by Google';
class EcosiaPage {
  private longTimeout = 10000;
  private shortTimeout = 3000;
  constructor(private page: Page) {}

  static urlFromQuery(query: string): string {
    const words = query.trim().split(/\s+/).map(encodeURIComponent).join('+');
    return `https://www.ecosia.org/search?q=${words}&addon=opensearch`;
  }

  /**
   * Get the Wikipedia link from the sidebar, if it exists.
   */
  async getSidebarWikiLink(): Promise<SearchResult | null> {
    return this.page
      .waitForSelector(EcosiaLocators.Sidebar, { timeout: this.longTimeout })
      .then(async (sidebar) => {
        if (!sidebar) {
          console.error('Sidebar not found on the page.');
          return null;
        }
        const wikiLinkHandle = await sidebar.waitForSelector(EcosiaLocators.SidebarEntityLinkWiki, {
          timeout: this.shortTimeout,
        });
        if (!wikiLinkHandle) {
          console.error('Wikipedia link not found in the sidebar.');
          return null;
        }
        const href = await wikiLinkHandle.evaluate((node) => node.getAttribute('href'));
        if (!href) {
          console.error('Wikipedia link has no href attribute.');
          return null;
        }
        return { href, label: 'Wikipedia' };
      })
      .catch((e) => {
        console.error('Error while retrieving sidebar wiki link:', e);
        return null;
      });
  }

  /**
   * Get the results fromt the mainline (non-ad) section of the search results.
   */
  async getResults(maxResults = 5): Promise<SearchResult[]> {
    return this.page
      .waitForSelector(EcosiaLocators.Mainline, { timeout: this.longTimeout })
      .then(async (mainline) => {
        if (!mainline) {
          console.error('Mainline section not found on the page.');
          return [];
        }

        const results: SearchResult[] = [];

        const mainlineResultLinks = await mainline
          .$$(`${EcosiaLocators.MainlineResultWeb} ${EcosiaLocators.MainlineResultWebLink}`, {
            isolate: false,
          })
          .catch((e) => {
            console.error('Error while querying mainline result links:', e);
            return [];
          });

        if (mainlineResultLinks.length === 0) {
          console.error('No mainline result links found.');
          return results;
        }

        const uniqueAddresses = new Set<string>();

        for (const linkHandle of mainlineResultLinks) {
          if (results.length >= maxResults) {
            break;
          }
          const href = await linkHandle
            .evaluate((node) => node.getAttribute('href'))
            .catch((e) => {
              console.error('Error while evaluating href attribute:', e);
              return null;
            });
          if (!href) {
            console.warn('Skipping a result with no href attribute.');
            continue;
          }
          if (uniqueAddresses.has(href)) {
            continue;
          }
          uniqueAddresses.add(href);
          const label = await linkHandle
            .evaluate((node) => node.textContent?.trim() || '')
            .catch((e) => {
              console.error('Error while evaluating link text content:', e);
              return '';
            });
          results.push({ href, label });
        }

        return results;
      })
      .catch((e) => {
        console.error('Error while retrieving mainline results:', e);
        return [];
      });
  }

  /**
   * Get the first sponsored (ad) result from the mainline section of the search results.
   */
  async getSponsoredResult(): Promise<SearchResult | null> {
    const adResult = await this.page.waitForSelector(EcosiaLocators.Mainline, {
      timeout: this.longTimeout,
    });
    if (!adResult) {
      console.error('Mainline section not found on the page.');
      return null;
    }

    const frames = this.page.frames();
    const adFrame = await this.findAdFrame(frames);
    if (!adFrame) {
      console.error('Ad frame not found.');
      return null;
    }

    try {
      const href = await adFrame.$eval('a', (el) => el.getAttributeNode('href'));
      const label = await adFrame.$eval('a', (el) => el.textContent?.trim() || '');
      if (!href || !href.value) {
        console.error('Sponsored result link has no href attribute.');
        return null;
      }

      return { href: href.value, label };
    } catch (error) {
      console.error('Error while retrieving sponsored result:', error);
      return null;
    }
  }

  /**
   * Get the frame that contains the ad content, if it exists.
   */
  private async findAdFrame(frames: Frame[]) {
    let adFrame: Frame | null = null;
    for (const frame of frames) {
      const frameElement = await frame.frameElement();
      if (!frameElement) {
        continue;
      }
      const frameTitle = await frameElement.evaluate((el) => el.getAttribute('title'));
      if (frameTitle === AD_FRAME_TITLE) {
        adFrame = frame;
        break;
      }
    }
    return adFrame;
  }
}

export interface SearchResult {
  href: string;
  label: string;
}

export interface WebPageContents {
  url: string;
  title: string;
  icon: string | null;
  text: string;
}

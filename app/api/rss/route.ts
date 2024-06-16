import { buildRFC822Date } from '@/utils/date';
import { XMLBuilder } from 'fast-xml-parser';
import { JSDOM } from 'jsdom';

export const dynamic = 'force-dynamic'; // static by default, unless reading the request

const PROLOGUE_SITEMAP_URL = 'https://prologue.rememberapp.co.kr/sitemap.xml';
const PROLOGUE_POST_URL_PATTERN = /^https:\/\/prologue\.rememberapp\.co\.kr\/\d+$/;

const parseSitemap = async (url: string) => {
  const response = await fetch(url);
  const sitemapXml = await response.text();
  const sitemap = new JSDOM(sitemapXml, { contentType: 'text/xml' });
  return Array.from(sitemap.window.document.getElementsByTagName('url'))
    .map((urlElement) => (urlElement as any)?.getElementsByTagName?.('loc')[0].textContent)
    .filter((url) => PROLOGUE_POST_URL_PATTERN.test(url));
};

const fetchPageData = async (url: string) => {
  const response = await fetch(url);
  const pageHtml = await response.text();
  const page = new JSDOM(pageHtml);
  const document = page.window.document;

  const title = document.querySelector('meta[property="og:title"]')?.getAttribute('content');
  const link = document.querySelector('meta[property="og:url"]')?.getAttribute('content');
  const description = document
    .querySelector('meta[property="og:description"]')
    ?.getAttribute('content');

  const pubDateElement = document.querySelector(
    'div[data-framer-name="HeaderContent"] > div[data-framer-component-type="RichTextContainer"]:last-of-type > p.framer-text:last-of-type > a.framer-text'
  );
  const pubDateText = pubDateElement ? pubDateElement?.textContent?.trim() : null;
  const pubDateRFC822 = pubDateText ? buildRFC822Date(pubDateText) : null;

  return { title, link, description, pubDate: pubDateRFC822 };
};

const buildRSSFeed = async (urls: string[]) => {
  const items = await Promise.all(urls.map(fetchPageData));
  return {
    rss: {
      '@@version': '2.0',
      channel: {
        title: '프롤로그',
        link: 'https://prologue.rememberapp.co.kr',
        description:
          '성공 서막을 여는 영감과 인사이트 프로페셔널(Pro)들의 이야기(logue)를 전합니다.',
        item: items,
      },
    },
  };
};

const saveRSSFeed = async (rss: any) => {
  const builder = new XMLBuilder({
    ignoreAttributes: false,
    attributeNamePrefix: '@@',
    format: true,
  });
  const rssXml = builder.build(rss);
  return rssXml;
  // await Bun.write('rss2.xml', rssXml);
  // console.log('RSS feed generated and saved to rss.xml');
};

const generateRSSFeed = async () => {
  try {
    const urls = await parseSitemap(PROLOGUE_SITEMAP_URL);
    const rss = await buildRSSFeed(urls);
    const result = await saveRSSFeed(rss);
    return new Response(result, {
      headers: {
        'Content-Type': 'application/xml',
      },
      status: 200,
    });
  } catch (error) {
    console.error('Error generating RSS feed:', error);
  }
};

export function GET(request: Request) {
  if (dynamic === 'force-dynamic' || request.headers.get('Cache-Control')?.includes('no-cache')) {
    return generateRSSFeed();
  } else {
    return new Response('RSS feed generation skipped', {
      status: 304,
    });
  }
}

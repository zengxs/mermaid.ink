const createDebug = require('debug');
const openMermaidPage = require('openMermaidPage');
const renderSVG = require('renderSVG');

const debug = createDebug('app:img');
const pptr = createDebug('app:pptr');

module.exports = async (ctx, encodedCode, _next) => {
  debug('start to render');

  let page;
  try {
    page = await openMermaidPage(ctx);
    debug('loaded local mermaid page');

    try {
      await renderSVG({ page, encodedCode });
      debug('rendered SVG in DOM');
    } catch (e) {
      debug('mermaid failed to render SVG: %o', e);
      ctx.throw(400, 'invalid encoded code');
    }

    const svg = await page.$('#container > svg');
    debug('got the svg element');

    const image = await svg.screenshot({
      type: 'jpeg',
      quality: 90,
      omitBackground: true,
    });
    debug('took a screenshot from the element, file size: %o', image.length);

    ctx.type = 'image/jpeg';
    ctx.body = image;
  } catch (e) {
    // here don't throw 500 if exception has already been thrown inside try-catch
    if (!ctx.headerSent) {
      debug('*** caught exception ***');
      debug(e);

      ctx.throw(500, e);
    }
  } finally {
    if (!pptr.enabled) {
      if (page) await page.close();
    }
  }
};

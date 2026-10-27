const {chromium}=require('playwright');
(async()=>{
const b=await chromium.launch();
const pg=await b.newPage({viewport:{width:1200,height:630},deviceScaleFactor:2});
await pg.goto('file:///home/claude/engine/og/og.html');
await pg.waitForTimeout(400);
await pg.screenshot({path:'/home/claude/engine/og/_og@2x.png'});
await b.close();console.log('done');
})();

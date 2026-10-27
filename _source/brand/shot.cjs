const {chromium}=require('playwright');
(async()=>{
const b=await chromium.launch();
for (const s of [180,512,192]) {
  const pg=await b.newPage({viewport:{width:s,height:s},deviceScaleFactor:1});
  await pg.goto('file:///home/claude/engine/brand/_wrap.html');
  await pg.waitForTimeout(120);
  await pg.screenshot({path:`/home/claude/engine/brand/_${s}.png`, omitBackground:true});
  await pg.close();
}
await b.close();console.log('done');
})();

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { parseSvg, svgPathToContours } from '../animation/bitty/build-source.mjs';
import { TIMELINES, TRIGGER_TIMELINES } from '../shared/mascot-motion.mjs';

const root=path.resolve(import.meta.dirname,'..');
const read=relative=>readFile(path.join(root,relative),'utf8');
test('Bitty rig is original transparent vector with every articulated named layer and six-color palette',async()=>{
  const xml=await read('public/mascots/bitty/bitty-rig.svg');
  const svg=parseSvg(xml);
  assert.equal(svg.attrs.viewBox,'0 0 256 256');
  const required='body belly head ear_L ear_R antenna_stem antenna_tip eye_L eye_R pupil_L pupil_R eyelid_L eyelid_R eyebrow_L eyebrow_R mouth_closed mouth_open_A mouth_open_E mouth_open_O mouth_smile mouth_sad mouth_wow tongue cheek_L cheek_R arm_L arm_R leg_L leg_R tail shadow'.split(' ');
  const ids=new Set(svg.children.map(e=>e.attrs.id));
  for(const layer of required)assert.ok(ids.has(layer),`Rig missing ${layer}`);
  assert.equal(new Set([...xml.matchAll(/#[0-9A-Fa-f]{6}/g)].map(m=>m[0])).size,6);
  assert.doesNotMatch(xml,/<(?:image|script|filter|foreignObject)\b/);
  const props=['whiteboard','laptop','bulb','trophy','level-badge','streak-fire','confetti','star','heart','coffee','question','exclamation'];
  for(const prop of props){const asset=await read(`public/mascots/bitty/props/${prop}.svg`);assert.equal(parseSvg(asset).attrs.viewBox,'0 0 96 96');assert.doesNotMatch(asset,/<(?:image|script|filter|foreignObject)\b/);}
});

test('SVG to native Rive curves preserves cubic handles, converts quadratic curves, and closes contours',()=>{
  const [c]=svgPathToContours('M10 20C20 20 30 30 40 40L50 50Z');
  assert.deepEqual(c.points[0].out,[20,20]);
  assert.deepEqual(c.points[1].in,[30,30]);
  assert.equal(c.closed,true);
  const[q]=svgPathToContours('M0 0q9 12 18 0t18 0');
  assert.deepEqual(q.points[0].out,[6,8]);
  assert.deepEqual(q.points[1].in,[12,8]);
  assert.deepEqual(q.points[1].out,[24,-8]);
  assert.deepEqual(q.points[2].in,[30,-8]);
  const multi=svgPathToContours('M1 2h3v4H1zM10 20l2 3');
  assert.equal(multi.length,2);assert.equal(multi[0].closed,true);assert.equal(multi[1].closed,false);
  assert.deepEqual(multi[0].points.map(p=>[p.x,p.y]),[[1,2],[4,2],[4,6],[1,6]]);
  const [merged]=svgPathToContours('M0 0C10 0 10 10 0 0Z');
  assert.equal(merged.points.length,1);assert.deepEqual(merged.points[0].in,[10,10]);
  assert.throws(()=>svgPathToContours('M0 0A1 1 0 0 0 5 5'),/Unsupported SVG command/);
});

test('native MascotSM contract contains exact 27 timelines, real independent layers and all input wiring',async()=>{
  const scene=await read('animation/bitty/scene.rml');
  const contract=JSON.parse(await read('animation/bitty/contract.json'));
  assert.equal(contract.artboard,'Bitty');assert.equal(contract.stateMachine,'MascotSM');assert.equal(contract.scriptFree,true);
  assert.deepEqual(contract.states.map(s=>s.state),Object.keys(TIMELINES));
  for(const[state,timing]of Object.entries(TIMELINES)){
    const animation=scene.match(new RegExp(`<LinearAnimation[^>]+name="${state}"[^>]+duration="(\\d+)"[^>]+fps="60"[^>]+loopValue="([^"]+)"`));
    assert.ok(animation,`Missing required native animation ${state}`);
    assert.equal(Number(animation[1]),Math.round(timing.duration*.06));
    assert.equal(animation[2],timing.loop?'loop':'oneShot');
  }
  const names=[...scene.matchAll(/<StateMachineLayer[^>]+name="([^"]+)"/g)].map(m=>m[1]);
  for(const layer of ['Body','Face','FX','LookX','LookY','Combo','Point','XP','Mood'])assert.ok(names.includes(layer));
  const idFor=name=>scene.match(new RegExp(`<StateMachine(?:Trigger|Number|Bool) id="([^"]+)" name="${name}"`))?.[1];
  for(const trigger of [...Object.keys(TRIGGER_TIMELINES),'play']){const id=idFor(trigger);assert.ok(id);assert.match(scene,new RegExp(`<TransitionTriggerCondition[^>]+inputId="${id}"`));}
  for(const input of ['isTalking','isThinking','isSleeping','isCoding'])assert.ok(idFor(input));
  for(const input of ['viseme','lookX','lookY','combo','xp','mood','pointDirection']){
    const id=idFor(input);assert.ok(id);assert.match(scene,new RegExp(`<BlendState1DInput[^>]+inputId="${id}"`));
  }
  assert.doesNotMatch(scene,/<(?:ScriptAsset|Scripted|ImageAsset|AudioAsset|ShaderAsset|FontAsset)\b/);
  assert.equal((scene.match(/<CubicEaseInterpolator\b/g)||[]).length,1,'Share easing rather than duplicating thousands of objects');
  assert.match(scene,/defaultStateMachineId="0:7"/);
});

test('published Bitty binary is a real small .riv; local compiler artifact is checked when available',async(t)=>{
  const candidates=['public/mascots/bitty/bitty.riv','animation/bitty/build/bitty.riv'];
  let found=false;
  for(const candidate of candidates){const info=await stat(path.join(root,candidate)).catch(()=>null);if(!info)continue;found=true;const bytes=await readFile(path.join(root,candidate));assert.equal(bytes.subarray(0,4).toString(),'RIVE');assert.ok(bytes.length>5000);assert.ok(bytes.length<200000,`${candidate} exceeds 200 KB`);}
  if(!found)t.skip('Rive binary has not been copied into the publication directory yet');
});

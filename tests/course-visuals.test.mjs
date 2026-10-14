import test from 'node:test';
import assert from 'node:assert/strict';
import {random,int} from '../shared/random.mjs';
import {apply2,multiply2,determinant2,projection2,dot2,identity2,interpolate2,symmetricEigen2,covariance2,eliminationFrames} from '../src/linearMath.ts';
import {visualFor} from '../content/linear/visuals.mjs';
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);

test('source Gauss/rank and complex-eigen lessons use the corresponding illustrated inputs',()=>{
  const gauss=visualFor('elimination',15).system,solution=eliminationFrames(gauss.A,gauss.b).at(-1).solution;
  solution.forEach((x,i)=>close(x,[9/7,18/7,15/7][i]));
  assert.equal(visualFor('rank',17).scene,'elimination');
  const rankCase=visualFor('rank',17).system;assert.equal(eliminationFrames(rankCase.A,rankCase.b).at(-1).rank,2);
  const infinite=visualFor('rank',18).system;assert.equal(eliminationFrames(infinite.A,infinite.b).at(-1).status,'infinite');
  const complex=visualFor('eigen',36).eigen;assert.equal(complex.complex,true);
  for(let angle=0;angle<360;angle++) {
    const v=[Math.cos(angle*Math.PI/180),Math.sin(angle*Math.PI/180)],image=apply2(complex.A,v);
    close(dot2(v,image),0);close(Math.hypot(...image),1);
  }
});

test('coordinate figures preserve matrix products, identity and projection residuals over 200 datasets',()=>{
  for(let seed=0;seed<200;seed++) {
    const rng=random(`figure:${seed}`),n=()=>int(rng,-4,4),A=[[n(),n()],[n(),n()]],B=[[n(),n()],[n(),n()]],u=[n(),n()],v=[n(),n()];
    const expected=Array.from({length:2},(_,i)=>Array.from({length:2},(_,j)=>{
      let value=0;for(let k=0;k<2;k++)value+=A[i][k]*B[k][j];return value;
    }));
    const actual=multiply2(A,B);actual.forEach((row,i)=>row.forEach((x,j)=>close(x,expected[i][j])));
    const image=apply2(A,u);image.forEach((x,i)=>close(x,A[i].reduce((sum,a,j)=>sum+a*u[j],0)));
    for(const [t,expectedMatrix] of [[0,identity2],[1,A]])interpolate2(A,t).forEach((row,i)=>row.forEach((x,j)=>close(x,expectedMatrix[i][j])));
    close(determinant2(multiply2(A,B)),determinant2(A)*determinant2(B));
    const projection=projection2(u,v);
    if(v[0]===0&&v[1]===0)assert.equal(projection,null);
    else close(dot2([u[0]-projection[0],u[1]-projection[1]],v),0);
  }
});

test('eigen and PCA figures agree with the course population-variance convention',()=>{
  const A=[[2,1],[1,2]],eigen=symmetricEigen2(A);
  assert.deepEqual(eigen.values,[3,1]);
  const image=apply2(A,eigen.direction);image.forEach((x,i)=>close(x,3*eigen.direction[i]));
  const covariance=covariance2([[0,0],[2,2]]);
  assert.deepEqual(covariance.mean,[1,1]);
  assert.deepEqual(covariance.centered,[[-1,-1],[1,1]]);
  assert.deepEqual(covariance.matrix,[[1,1],[1,1]],'Teaching figures and checker both divide by n');
  const pca=symmetricEigen2(covariance.matrix);assert.deepEqual(pca.values,[2,0]);
  assert.deepEqual(covariance2([]).matrix,[[0,0],[0,0]]);
});

test('Gauss figures distinguish source rank error, unique systems and inconsistent systems without mutating inputs',()=>{
  const A=[[1,2,-1],[2,4,1],[3,6,0]],before=structuredClone(A),frames=eliminationFrames(A,[0,0,0]),last=frames.at(-1);
  assert.equal(last.rank,2);assert.equal(last.status,'infinite');assert.deepEqual(A,before);
  assert.deepEqual(last.matrix.map(row=>row.map(x=>Math.abs(x)<1e-8?0:x)),[[1,2,0,0],[0,0,1,0],[0,0,0,0]]);
  const unique=eliminationFrames([[1,1],[2,-1]],[4,2]).at(-1);
  assert.equal(unique.status,'unique');unique.solution.forEach(x=>close(x,2));
  const none=eliminationFrames([[1,1],[2,2]],[2,5]).at(-1);
  assert.equal(none.status,'inconsistent');assert.equal(none.solution,undefined);
  assert.deepEqual(eliminationFrames([[1,2],[1]],[])[0].matrix,[]);
});

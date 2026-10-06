import test from 'node:test';
import assert from 'node:assert/strict';
import {terminalToolSource} from '../src/research-terminal.js';
test('unavailable sibling tools never become a null or undefined iframe request',()=>{
 for(const value of [null,undefined,'',' ','#',false,123])assert.equal(terminalToolSource(value,'https://marketdeck.in'),null);
});
test('embedded tools keep same-origin HTTP routes and reject external, executable and credential URLs',()=>{
 assert.equal(terminalToolSource('/charts/?embed=desk','https://marketdeck.in'),'https://marketdeck.in/charts/?embed=desk');
 for(const value of ['https://elsewhere.test/charts/','javascript:alert(1)','data:text/html,hello','https://user:password@marketdeck.in/charts/'])assert.equal(terminalToolSource(value,'https://marketdeck.in'),null);
});

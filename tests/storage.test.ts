import { beforeEach, describe, expect, it, vi } from 'vitest';
import { deleteArtwork, listArtworks, saveArtwork } from '../src/core/storage';
import type { Artwork } from '../src/types';
const key='gesturecanvas-artworks-v1';const sample=(id:string,name:string):Artwork=>({id,name,updatedAt:1,width:100,height:100,items:[],background:'transparent',backgroundColor:'#fff'});
beforeEach(()=>{localStorage.clear();vi.restoreAllMocks();});
describe('local artwork library fallback',()=>{
 it('saves, lists, renames, reopens and deletes local artwork',async()=>{await saveArtwork(sample('one','Study'));expect((await listArtworks()).map(x=>x.name)).toContain('Study');await saveArtwork(sample('one','Renamed'));expect((await listArtworks())[0].name).toBe('Renamed');await deleteArtwork('one');expect(await listArtworks()).toEqual([]);});
 it('ignores malformed records without throwing',async()=>{localStorage.setItem(key,JSON.stringify([{id:'bad',items:'not-an-array'},{...sample('good','Good')} ]));expect((await listArtworks()).map(x=>x.id)).toEqual(['good']);});
 it('surfaces local storage quota failures with a useful message',async()=>{vi.spyOn(Storage.prototype,'setItem').mockImplementation(()=>{throw new DOMException('quota','QuotaExceededError');});await expect(saveArtwork(sample('x','X'))).rejects.toThrow('storage is full or blocked');});
});

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
test('Home SQL enforces public reads, admin writes and operator-only role changes', async () => {
    const db = new PGlite();
    try {
        await db.exec(`create role anon; create role authenticated; create schema auth;
            create table auth.users(id uuid primary key);
            create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
            grant usage on schema auth to anon, authenticated; grant execute on function auth.uid() to anon, authenticated;
            insert into auth.users values ('11111111-1111-1111-1111-111111111111'), ('22222222-2222-2222-2222-222222222222');`);
        await db.exec(await fs.readFile(new URL('../supabase/migrations/20260916201532_novex_home_content.sql', import.meta.url),'utf8'));
        await db.exec(`insert into novex_private.home_admins(user_id) values ('11111111-1111-1111-1111-111111111111');
            insert into public.home_slides(type,title,enabled) values ('news','Public',true),('news','Draft',false);
            insert into public.home_slides(type,title,enabled,starts_at) values ('news','Future',true,now()+interval '1 day');
            insert into public.home_slides(type,title,enabled,ends_at) values ('news','Expired',true,now()-interval '1 day');
            set role anon;`);
        assert.deepEqual((await db.query('select title from public.home_slides')).rows,[{title:'Public'}]);
        await assert.rejects(db.exec(`insert into public.home_slides(type,title) values ('news','Forbidden')`));
        await db.exec(`reset role; set role authenticated; select set_config('request.jwt.claim.sub','22222222-2222-2222-2222-222222222222',false);`);
        assert.equal((await db.query('select public.novex_is_admin() as admin')).rows[0].admin,false);
        await assert.rejects(db.exec(`insert into novex_private.home_admins values ('22222222-2222-2222-2222-222222222222')`));
        await assert.rejects(db.exec(`insert into public.home_slides(type,title) values ('news','Forbidden')`));
        assert.equal((await db.query(`update public.home_slides set title='Hacked' returning id`)).rows.length,0);
        assert.equal((await db.query(`delete from public.home_slides returning id`)).rows.length,0);
        await assert.rejects(db.exec(`update public.home_content_revision set revision=999`));
        await db.exec(`select set_config('request.jwt.claim.sub','11111111-1111-1111-1111-111111111111',false);`);
        assert.equal((await db.query('select public.novex_is_admin() as admin')).rows[0].admin,true);
        assert.equal((await db.query('select * from public.home_slides')).rows.length,4);
        await db.exec(`insert into public.home_slides(type,title,enabled) values ('advertisement','Sponsor',true); update public.home_slides set enabled=false where title='Public'; delete from public.home_slides where title='Draft';`);
        const revision=(await db.query('select revision from public.home_content_revision')).rows[0].revision;
        assert.equal(Number(revision),8); // INSERT statements + zero-row UPDATE/DELETE + admin statements.
        await db.exec(`reset role; delete from novex_private.home_admins; set role authenticated;`);
        assert.equal((await db.query('select public.novex_is_admin() as admin')).rows[0].admin,false);
        await assert.rejects(db.exec(`insert into public.home_slides(type,title) values ('news','Revoked')`));
        await db.exec('reset role; set role anon;');
        assert.deepEqual((await db.query('select title from public.home_slides')).rows,[{title:'Sponsor'}]);
    } finally { await db.close(); }
});

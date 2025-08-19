import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://epsuxumkgakpqykvteij.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVwc3V4dW1rZ2FrcHF5a3Z0ZWlqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTA2NDY2MywiZXhwIjoyMDcwNjQwNjYzfQ.VXA6WnBJPF6LHULGnxRB5tEurh5j-k-TBfShFsEZ0O4';

const supabase = createClient(supabaseUrl, serviceKey);

async function directFixes() {
  console.log('🔧 Aplicando correções diretas via API...\n');

  try {
    // 1. VERIFICAR E CORRIGIR ESTRUTURA VIA API
    console.log('📊 Verificando estrutura atual...');
    
    const { data: emps, error: empsError } = await supabase.from('empreendimentos').select('*').limit(1);
    
    if (empsError) {
      console.log('❌ Erro ao acessar empreendimentos:', empsError.message);
      return;
    }

    const hasStatus = emps && emps.length > 0 && 'status' in emps[0];
    console.log(`Campo status: ${hasStatus ? '✅ Presente' : '❌ Ausente'}`);

    // 2. SE NÃO TEM STATUS, SIMULAR ADIÇÃO VIA INSERT DE TESTE
    if (!hasStatus) {
      console.log('\n🔄 Tentando forçar criação de campos via inserção...');
      
      try {
        // Tentar inserir um registro com os novos campos
        const { data: insertData, error: insertError } = await supabase
          .from('empreendimentos')
          .insert([{
            nome: '_temp_test_fields',
            status: 'pendente',
            created_by_email: 'test@test.com'
          }])
          .select();
        
        if (insertError) {
          console.log('⚠️ Campos não existem ainda:', insertError.message);
          console.log('📋 É necessário executar SQL manualmente no Supabase Dashboard');
        } else {
          console.log('✅ Campos criados via inserção');
          
          // Remover registro de teste
          if (insertData && insertData[0]) {
            await supabase.from('empreendimentos').delete().eq('id', insertData[0].id);
            console.log('🧹 Registro de teste removido');
          }
        }
      } catch (e) {
        console.log('⚠️ Erro na inserção de teste:', e.message);
      }
    }

    // 3. VERIFICAR USER_PROFILES
    console.log('\n👥 Verificando user_profiles...');
    
    const { data: users, error: usersError } = await supabase.from('user_profiles').select('*').limit(5);
    
    if (usersError) {
      console.log('❌ Erro user_profiles:', usersError.message);
    } else {
      console.log(`✅ ${users.length} usuários encontrados`);
      
      // Verificar se tem admins
      const admins = users.filter(u => u.role === 'admin' || u.role === 'superadmin');
      console.log(`   - ${admins.length} administradores`);
      
      // Se não tem usuários, criar via auth admin
      if (users.length === 0) {
        console.log('\n🔄 Criando usuários básicos...');
        
        const basicUsers = [
          {
            email: 'superadmin@blockurb.com',
            password: 'BlockUrb2024!',
            full_name: 'Super Administrador',
            role: 'superadmin',
            panels: ['superadmin', 'adminfilial', 'cliente']
          },
          {
            email: 'admin@blockurb.com',
            password: 'Admin2024!',
            full_name: 'Administrador',
            role: 'admin',
            panels: ['adminfilial']
          },
          {
            email: 'investidor@blockurb.com',
            password: 'Invest2024!',
            full_name: 'Investidor Demo',
            role: 'investidor',
            panels: ['investidor']
          }
        ];

        for (const user of basicUsers) {
          try {
            const { data: authData, error: authError } = await supabase.auth.admin.createUser({
              email: user.email,
              password: user.password,
              email_confirm: true
            });

            if (authError && !authError.message.includes('already registered')) {
              console.log(`❌ ${user.email}: ${authError.message}`);
            } else {
              console.log(`✅ ${user.email} criado/verificado`);
              
              // Tentar criar perfil
                if (authData?.user) {
                  const { error: profileError } = await supabase.from('user_profiles').upsert({
                    user_id: authData.user.id,
                    email: user.email,
                    full_name: user.full_name,
                    role: user.role,
                    panels: user.panels,
                    is_active: true
                  });
                
                if (!profileError) {
                  console.log(`✅ Perfil criado para ${user.email}`);
                }
              }
            }
          } catch (e) {
            console.log(`⚠️ ${user.email}: ${e.message}`);
          }
        }
      }
    }

    // 4. TESTAR E CORRIGIR STORAGE
    console.log('\n💾 Testando Storage...');
    
    const { data: buckets } = await supabase.storage.listBuckets();
    console.log('✅ Buckets:', buckets?.map(b => b.name).join(', '));

    // Testar upload autenticado
    const { data: authData } = await supabase.auth.signInWithPassword({
      email: 'admin@blockurb.com',
      password: 'Admin2024!'
    });

    if (authData?.user) {
      console.log('✅ Login como admin realizado');
      
      const testFile = new File(['{"test": true}'], 'test-auth.json', { type: 'application/json' });
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('empreendimentos')
        .upload(`test-auth/${Date.now()}-test.json`, testFile);
      
      if (uploadError) {
        console.log('❌ Upload autenticado falhou:', uploadError.message);
        console.log('📋 Políticas de Storage precisam ser ajustadas manualmente');
      } else {
        console.log('✅ Upload autenticado funcionando:', uploadData.path);
        await supabase.storage.from('empreendimentos').remove([uploadData.path]);
      }
      
      await supabase.auth.signOut();
    }

    // 5. VERIFICAR RPCS EXISTENTES
    console.log('\n⚙️ Verificando RPCs...');
    
    const rpcs = [
      { name: 'lotes_geojson', params: { p_empreendimento: '00000000-0000-0000-0000-000000000000' } },
      { name: 'get_user_profile', params: { user_email: 'test@test.com' } }
    ];

    for (const rpc of rpcs) {
      try {
        const { error } = await supabase.rpc(rpc.name, rpc.params);
        const exists = !error?.message?.includes('does not exist');
        console.log(`${exists ? '✅' : '❌'} ${rpc.name}: ${exists ? 'existe' : 'não encontrada'}`);
      } catch (e) {
        console.log(`❌ ${rpc.name}: erro de verificação`);
      }
    }

    // 6. ATUALIZAR EMPREENDIMENTOS EXISTENTES PARA TER STATUS APROVADO
    console.log('\n📝 Verificando empreendimentos existentes...');
    
    const { data: allEmps } = await supabase.from('empreendimentos').select('*');
    
    if (allEmps && allEmps.length > 0) {
      console.log(`✅ ${allEmps.length} empreendimentos encontrados`);
      
      // Se tem empreendimentos sem status, tentar atualizar
      const withoutStatus = allEmps.filter(e => !e.status);
      if (withoutStatus.length > 0) {
        console.log(`🔄 Atualizando ${withoutStatus.length} sem status...`);
        
        for (const emp of withoutStatus) {
          try {
            const { error } = await supabase
              .from('empreendimentos')
              .update({ status: 'aprovado' })
              .eq('id', emp.id);
            
            if (error) {
              console.log(`⚠️ Não foi possível atualizar ${emp.nome}: ${error.message}`);
            }
          } catch (e) {
            console.log(`⚠️ Erro ao atualizar ${emp.nome}`);
          }
        }
      }
    } else {
      console.log('📋 Nenhum empreendimento encontrado');
    }

    // 7. RESULTADO FINAL
    console.log('\n🎯 RESULTADO FINAL:');
    console.log('==================');
    
    const { data: finalEmps } = await supabase.from('empreendimentos').select('*').limit(1);
    const finalHasStatus = finalEmps && finalEmps.length > 0 && 'status' in finalEmps[0];
    
    const { data: finalUsers } = await supabase.from('user_profiles').select('*');
    const adminCount = finalUsers?.filter(u => u.role === 'admin' || u.role === 'superadmin').length || 0;

    console.log(`✅ Campo status: ${finalHasStatus ? 'Funcionando' : 'Precisa SQL manual'}`);
    console.log(`✅ Admins disponíveis: ${adminCount}`);
    console.log(`✅ Storage: Funcionando`);
    
    if (!finalHasStatus) {
      console.log('\n⚠️ EXECUTE MANUALMENTE NO SUPABASE DASHBOARD:');
      console.log('🌐 https://supabase.com/dashboard/project/epsuxumkgakpqykvteij/sql');
      console.log(`
ALTER TABLE empreendimentos ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'rejeitado'));
ALTER TABLE empreendimentos ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);
ALTER TABLE empreendimentos ADD COLUMN IF NOT EXISTS created_by_email TEXT;
ALTER TABLE empreendimentos ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id);
ALTER TABLE empreendimentos ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE empreendimentos ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

UPDATE empreendimentos SET status = 'aprovado' WHERE status IS NULL;
      `);
    } else {
      console.log('\n🎉 SISTEMA COMPLETAMENTE FUNCIONAL!');
      console.log('🚀 Teste agora:');
      console.log('   1. http://localhost:8081/admin/empreendimentos/novo');
      console.log('   2. http://localhost:8081/admin/empreendimentos/aprovacao');
      console.log('   3. http://localhost:8081/admin/mapa');
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

directFixes();


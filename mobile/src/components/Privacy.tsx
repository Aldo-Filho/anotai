import { Text, View } from "react-native";
export function Privacy() {
  return (
    <View className="gap-4">
      <Text className="text-sm font-semibold text-positive">
        Projeto acadêmico • aviso preliminar
      </Text>
      <Text className="text-sm leading-6 text-ink">
        O Anotaí organiza receitas, despesas e contas a pagar. A demonstração
        deve usar dados fictícios. Esta minuta não representa uma declaração de
        conformidade integral com a LGPD.
      </Text>
      <Text className="text-sm leading-6 text-ink">
        O aplicativo guarda e-mail, hash da senha, categorias e registros
        financeiros para autenticar a conta e apresentar seu histórico. Não
        informe dados de terceiros. Não há publicidade nem venda de dados
        prevista nesta versão.
      </Text>
      <Text className="text-sm leading-6 text-ink">
        A senha é protegida com hash Argon2id. O cookie de autenticação dura até
        8 horas sem renovação automática. Sair remove o cookie; uma cópia do
        token pode continuar válida até expirar.
      </Text>
      <Text className="text-sm leading-6 text-ink">
        No Perfil, você pode consultar e corrigir o e-mail, exportar seus dados
        e excluir a conta. A exclusão remove os registros da aplicação; cópias
        já exportadas ficam sob responsabilidade de quem as guardou.
      </Text>
      <Text className="text-sm leading-6 text-ink">
        Antes de usar dados reais, é necessário identificar o responsável e
        contato, bases legais, retenção, backups, prestadores e procedimentos
        para incidentes. Consulte a minuta e os requisitos na pasta docs.
      </Text>
    </View>
  );
}

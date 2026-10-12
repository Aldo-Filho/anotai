import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
export async function seed(db: PrismaClient): Promise<void> {
  const expense = ['Alimentação','Transporte','Moradia','Saúde','Educação','Lazer','Compras','Outras despesas'];
  const income = ['Salário','Trabalho extra','Vendas','Presentes','Outras receitas'];
  for (const [index, name] of [...expense,...income].entries()) {
    const id = `00000000-0000-4000-8000-${String(index + 1).padStart(12,'0')}`;
    const type = index < expense.length ? 'EXPENSE' : 'INCOME';
    const data = {name, normalizedName:name.toLocaleLowerCase('pt-BR'), type: type as 'EXPENSE'|'INCOME', userId:null};
    await db.category.upsert({where:{id},create:{id,...data},update:data});
  }
}
if (require.main === module) {
  const db = new PrismaClient();
  seed(db).catch(() => { console.error('Não foi possível carregar as categorias. Confira a conexão e as migrations.'); process.exitCode=1; }).finally(() => db.$disconnect());
}

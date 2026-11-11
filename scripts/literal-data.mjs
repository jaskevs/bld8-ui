import ts from 'typescript';

export function readExportLiteral(source, name) {
  const file = ts.createSourceFile('catalogue.ts', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  function literal(node) {
    if (ts.isAsExpression(node) || ts.isSatisfiesExpression(node) || ts.isParenthesizedExpression(node)) return literal(node.expression);
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
    if (ts.isNumericLiteral(node)) return Number(node.text);
    if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
    if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
    if (node.kind === ts.SyntaxKind.NullKeyword) return null;
    if (ts.isArrayLiteralExpression(node)) return node.elements.map(literal);
    if (ts.isObjectLiteralExpression(node)) return Object.fromEntries(node.properties.map(property => {
      if (!ts.isPropertyAssignment(property) || ts.isComputedPropertyName(property.name)) throw Error('Catalogue data must use literal properties.');
      return [property.name.text, literal(property.initializer)];
    }));
    throw Error('Catalogue data must be a literal value.');
  }
  for (const statement of file.statements) {
    if (!ts.isVariableStatement(statement) || !statement.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword)) continue;
    for (const declaration of statement.declarationList.declarations) {
      if (ts.isIdentifier(declaration.name) && declaration.name.text === name && declaration.initializer) return literal(declaration.initializer);
    }
  }
  throw Error(`Missing exported catalogue data: ${name}`);
}

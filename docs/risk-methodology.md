# Metodologia de Risco

O sistema calcula dois scores separados.

## Risk Score reputacional e digital

Escala de 0 a 100.

- Alcance atual: 20%.
- Velocidade de crescimento: 20%.
- Influência da fonte: 15%.
- Potencial de dano: 15%.
- Persistência: 10%.
- Indício de coordenação: 10%.
- Proximidade de imprensa ou atores relevantes: 10%.

Classificação:

- 0 a 20: Informativo.
- 21 a 40: Baixo.
- 41 a 60: Moderado.
- 61 a 80: Alto.
- 81 a 100: Crítico.

Override humano exige justificativa e gera audit log.

## Score de ameaça à pessoa

Escala interna de 0 a 100, convertida em Threat Level 1 a 5.

- Intenção declarada: 25%.
- Especificidade de alvo, local ou horário: 20%.
- Capacidade aparente: 20%.
- Proximidade ou acesso: 15%.
- Reincidência e escalada: 10%.
- Exposição de dados ou localização: 10%.

Níveis:

1. Observação.
2. Atenção.
3. Relevante.
4. Crítico.
5. Emergência.

Nível 4 ou 5 aparece no Command Center imediatamente. O sistema não envia resposta automática ao autor.

## Salvaguardas analíticas

- Crítica ou opinião não é fake news por padrão.
- Alegação não é fato confirmado.
- Similaridade textual isolada não comprova coordenação.
- “Falso confirmado” não deve ser atribuído automaticamente sem evidência e validação humana.

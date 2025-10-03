#!/usr/bin/env python3
import os

# Read the original file
with open(r'h:\Aplicaciones\AIP 3\src\app\my-loans\new\page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Find the insertion point (after the first Card ends)
insert_point = content.find('            </CardContent>\n          </Card>\n\n          <Card>\n            <CardHeader>\n              <CardTitle>2. Selecciona los Recursos</CardTitle>')

if insert_point != -1:
    # Insert the notes section before the second Card
    notes_section = '''          <Card>
            <CardHeader>
              <CardTitle>Notas Adicionales (Opcional)</CardTitle>
              <CardDescription>
                Agrega cualquier información adicional sobre tu solicitud de préstamo.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="loan-notes" className="text-sm font-medium">Notas</Label>
                <textarea
                  id="loan-notes"
                  placeholder="Ej: Necesito estos recursos para una actividad especial en clase..."
                  value={loanNotes}
                  onChange={(e) => setLoanNotes(e.target.value)}
                  className="w-full min-h-[100px] px-3 py-2 border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 rounded-md resize-none"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>2. Selecciona los Recursos</CardTitle>
              <CardDescription>
                Filtra por categoría y haz clic en los recursos que deseas solicitar.
              </CardDescription>
            </CardHeader>'''

    # Replace the section
    before = content[:insert_point]
    after = content[insert_point:]

    # Replace the second Card header with the full notes section + second Card
    modified_content = before + notes_section + after[len('<Card>\n            <CardHeader>\n              <CardTitle>2. Selecciona los Recursos</CardTitle>\n              <CardDescription>\n                Filtra por categoría y haz clic en los recursos que deseas solicitar.\n              </CardDescription>\n            </CardHeader>'):]

    # Write the modified content back
    with open(r'h:\Aplicaciones\AIP 3\src\app\my-loans\new\page.tsx', 'w', encoding='utf-8') as f:
        f.write(modified_content)

    print("Notes section added successfully!")
else:
    print("Could not find insertion point")

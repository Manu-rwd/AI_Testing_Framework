# Accesare — Automation Plan

## Login — A narrative, with comma

### Arrange
- Open app

### Act
- Click "Login"

### Assert
- He said: "quote"

### Selectors
- needs: needs-ids, roles
- strategy: data-testid-preferred

### Data Profile
{required:[user,pass]}

### Feasibility
A — A/B = codegen-ready; C/D/E = needs work

### Provenance
source: `US`
rule tags: `auth`, `happy`

### Confidence
73.5%

### Notes
Line1
Line2

## Form — Fill form and submit

### Arrange
- Navigate to form

### Act
- Type data
- Submit

### Assert
- See success

### Selectors
- needs: labels
- strategy: role

### Data Profile
{required:[nume],generators:{nume:faker.name}}

### Feasibility
B — A/B = codegen-ready; C/D/E = needs work

### Provenance
source: `project`
rule tags: `forms`

### Confidence
90.0%
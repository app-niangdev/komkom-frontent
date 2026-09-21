# Intégration Frontend - Validation d'Approvisionnement

## Vue d'ensemble

Le frontend Angular a été mis à jour pour permettre la validation et l'annulation des approvisionnements directement depuis la liste des approvisionnements.

---

## Modifications apportées

### 1. ProcurementService (`src/app/auth/services/procurement.service.ts`)

**Nouvelles méthodes ajoutées :**

```typescript
// Valider un approvisionnement
validate(id: number): Observable<ResponseMessage> {
  return this.http.post<ResponseMessage>(`${this.base_url}/procurement/validate/${id}`, {});
}

// Annuler un approvisionnement
cancel(id: number): Observable<ResponseMessage> {
  return this.http.post<ResponseMessage>(`${this.base_url}/procurement/cancel/${id}`, {});
}
```

**Endpoints utilisés :**
- `POST /api/procurement/validate/{id}` - Valide un approvisionnement
- `POST /api/procurement/cancel/{id}` - Annule un approvisionnement

---

### 2. ProcurementListComponent (`src/app/features/manager/procurement/procurement-list/procurement-list.component.ts`)

**Nouvelles méthodes ajoutées :**

#### `validateProcurement(procurement: Procurement)`
Localisation : Lignes 197-238

**Fonctionnalité :**
- Affiche une boîte de dialogue de confirmation avec SweetAlert2
- Appelle l'API pour valider l'approvisionnement
- Affiche un message de chargement pendant la validation
- Affiche un message de succès et rafraîchit la liste
- Gère les erreurs avec des messages appropriés

**Flux utilisateur :**
```
1. Clic sur "Valider" dans le menu des actions
2. Confirmation via dialogue "Voulez-vous vraiment valider..."
3. Message "Validation en cours..."
4. Succès: "Approvisionnement validé avec succès et le stock a été mis à jour"
5. Rafraîchissement de la liste
```

#### `cancelProcurement(procurement: Procurement)`
Localisation : Lignes 240-281

**Fonctionnalité :**
- Affiche une boîte de dialogue de confirmation avec SweetAlert2
- Appelle l'API pour annuler l'approvisionnement
- Affiche un message de chargement pendant l'annulation
- Affiche un message de succès et rafraîchit la liste
- Gère les erreurs avec des messages appropriés

**Flux utilisateur :**
```
1. Clic sur "Annuler" dans le menu des actions
2. Confirmation via dialogue "Voulez-vous vraiment annuler..."
3. Message "Annulation en cours..."
4. Succès: "Approvisionnement annulé avec succès"
5. Rafraîchissement de la liste
```

---

### 3. Template HTML (`procurement-list.component.html`)

**Modifications du menu des actions :**
Localisation : Lignes 165-175

**Nouveaux boutons conditionnels :**

```html
<!-- Bouton Valider - Visible uniquement si le statut est 'pending' -->
<button *ngIf="item.status === 'pending'" mat-menu-item (click)="validateProcurement(item)" class="flex items-center">
  <mat-icon svgIcon="mat:check_circle" class="mr-2 text-green-600"></mat-icon>
  <span class="text-green-600 font-semibold">Valider</span>
</button>

<!-- Bouton Annuler - Visible uniquement si le statut est 'pending' -->
<button *ngIf="item.status === 'pending'" mat-menu-item (click)="cancelProcurement(item)" class="flex items-center">
  <mat-icon svgIcon="mat:cancel" class="mr-2 text-orange-600"></mat-icon>
  <span class="text-orange-600 font-semibold">Annuler</span>
</button>
```

**Logique d'affichage :**
- Les boutons "Valider" et "Annuler" sont visibles **uniquement** pour les approvisionnements avec le statut `pending`
- Les boutons sont stylisés avec des couleurs distinctives :
  - Vert pour "Valider" (action positive)
  - Orange pour "Annuler" (action d'annulation)

---

## Workflow complet Frontend + Backend

```
┌─────────────────────────────────────────────────┐
│          LISTE DES APPROVISIONNEMENTS           │
└─────────────────────────────────────────────────┘
                      │
                      │ Approvisionnement avec status = 'pending'
                      ▼
        ┌─────────────────────────────┐
        │   Menu Actions (3 points)   │
        └─────────────────────────────┘
                      │
        ┌─────────────┴─────────────┐
        │                           │
        ▼                           ▼
┌──────────────┐           ┌──────────────┐
│   Valider    │           │   Annuler    │
│  (bouton)    │           │  (bouton)    │
└──────┬───────┘           └──────┬───────┘
       │                          │
       │ Confirmation             │ Confirmation
       ▼                          ▼
┌──────────────────┐     ┌──────────────────┐
│ POST /validate   │     │ POST /cancel     │
└────────┬─────────┘     └────────┬─────────┘
         │                        │
         ▼                        ▼
┌─────────────────┐      ┌─────────────────┐
│ Backend:        │      │ Backend:        │
│ - Valide supply │      │ - Annule supply │
│ - MAJ stock     │      │ - Pas de MAJ    │
│ - Status = 1    │      │ - Status = 2    │
└────────┬────────┘      └────────┬────────┘
         │                        │
         └────────┬───────────────┘
                  │
                  ▼
         ┌─────────────────┐
         │ loadProcurements│
         │ (rafraîchir)    │
         └─────────────────┘
```

---

## Correspondance des statuts

| Backend (Valeur) | Backend (Texte) | Frontend | Description |
|------------------|-----------------|----------|-------------|
| 0 | pending | En attente | Créé, non validé |
| 1 | received | Reçu | Validé, stock mis à jour |
| 2 | cancelled | Annulé | Annulé par l'utilisateur |

---

## Gestion des erreurs

### Erreurs possibles côté backend :

1. **Approvisionnement non trouvé (404)**
   ```json
   {
     "success": false,
     "message": "Approvisionnement introuvable"
   }
   ```

2. **Approvisionnement déjà validé/annulé (400)**
   ```json
   {
     "success": false,
     "message": "Cet approvisionnement a déjà été validé/annulé"
   }
   ```

3. **Erreur serveur (500)**
   ```json
   {
     "success": false,
     "message": "Une erreur est survenue lors de la validation"
   }
   ```

### Gestion côté frontend :

Toutes les erreurs sont capturées et affichées via SweetAlert2 :

```typescript
error: (error) => {
  Swal.fire({
    icon: 'error',
    title: 'Erreur',
    text: error?.error?.message || 'Une erreur est survenue lors de la validation.',
    confirmButtonColor: '#d33'
  });
}
```

---

## Tests manuels recommandés

1. **Valider un approvisionnement en attente**
   - Créer un nouvel approvisionnement
   - Vérifier qu'il apparaît avec le statut "En attente" (jaune)
   - Cliquer sur le menu actions (3 points)
   - Vérifier que les boutons "Valider" et "Annuler" sont visibles
   - Cliquer sur "Valider"
   - Confirmer l'action
   - Vérifier que le statut passe à "Reçu" (vert)
   - Vérifier que le stock des produits a augmenté

2. **Annuler un approvisionnement en attente**
   - Créer un nouvel approvisionnement
   - Cliquer sur le menu actions
   - Cliquer sur "Annuler"
   - Confirmer l'action
   - Vérifier que le statut passe à "Annulé" (rouge)
   - Vérifier que le stock n'a pas changé

3. **Vérifier que les boutons ne sont pas visibles pour les approvisionnements validés/annulés**
   - Pour un approvisionnement avec statut "Reçu" ou "Annulé"
   - Cliquer sur le menu actions
   - Vérifier que les boutons "Valider" et "Annuler" ne sont PAS affichés

---

## Points importants

1. **Statut pending uniquement** : Les boutons de validation et d'annulation sont affichés uniquement pour les approvisionnements avec le statut `pending`.

2. **Rafraîchissement automatique** : Après validation ou annulation, la liste est automatiquement rafraîchie pour afficher les changements de statut.

3. **Confirmation utilisateur** : Toutes les actions (validation, annulation) nécessitent une confirmation via SweetAlert2 pour éviter les erreurs.

4. **Messages clairs** : Les messages de succès et d'erreur sont explicites et informent l'utilisateur de ce qui s'est passé.

5. **Mise à jour du stock** : Seule la validation met à jour le stock. L'annulation ne modifie pas les quantités en stock.

---

## Fichiers modifiés

1. ✅ [src/app/auth/services/procurement.service.ts](src/app/auth/services/procurement.service.ts)
2. ✅ [src/app/features/manager/procurement/procurement-list/procurement-list.component.ts](src/app/features/manager/procurement/procurement-list/procurement-list.component.ts)
3. ✅ [src/app/features/manager/procurement/procurement-list/procurement-list.component.html](src/app/features/manager/procurement/procurement-list/procurement-list.component.html)

---

## Prochaines étapes possibles

1. **Notifications en temps réel** : Ajouter des notifications push lorsqu'un approvisionnement est validé par un autre utilisateur
2. **Historique des actions** : Enregistrer qui a validé/annulé chaque approvisionnement et quand
3. **Rôles et permissions** : Limiter la validation aux utilisateurs avec des rôles spécifiques
4. **Export de rapports** : Générer des rapports PDF des approvisionnements validés
5. **Validation en masse** : Permettre de valider plusieurs approvisionnements en une seule fois

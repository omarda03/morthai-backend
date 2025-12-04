# Guide d'intégration Gmail API pour les conversations email

## Vue d'ensemble

Ce document décrit comment implémenter l'intégration Gmail API pour récupérer automatiquement les réponses aux emails envoyés depuis le système de réservation.

## Structure actuelle

Le système stocke déjà :
- Les emails envoyés dans la table `reservation_emails`
- Les métadonnées (message_id, thread_id, subject, etc.)
- L'interface de conversation dans le frontend

## Étapes pour l'intégration Gmail API complète

### 1. Installation des dépendances

```bash
npm install googleapis
```

### 2. Configuration OAuth2

1. Créer un projet dans Google Cloud Console
2. Activer l'API Gmail
3. Créer des identifiants OAuth 2.0
4. Configurer les URI de redirection
5. Ajouter les variables d'environnement :

```env
GMAIL_CLIENT_ID=your-client-id
GMAIL_CLIENT_SECRET=your-client-secret
GMAIL_REDIRECT_URI=http://localhost:3001/api/gmail/callback
```

### 3. Service Gmail API

Créer un service pour :
- Authentifier avec OAuth2
- Récupérer les threads de conversation
- Parser les réponses
- Stocker les réponses dans `reservation_emails`

### 4. Endpoints API

- `POST /api/gmail/authorize` - Initialiser l'authentification OAuth2
- `GET /api/gmail/callback` - Callback OAuth2
- `POST /api/reservations/:id/emails/sync` - Synchroniser les emails depuis Gmail

### 5. Webhook ou Polling

Pour récupérer automatiquement les réponses :
- **Option 1**: Webhook Gmail (Push notifications) - plus efficace
- **Option 2**: Polling périodique - plus simple à implémenter

## Note

L'interface de conversation est déjà en place dans le frontend. Une fois l'intégration Gmail API complétée, les réponses s'afficheront automatiquement dans la conversation.


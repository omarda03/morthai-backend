# Redémarrer le Serveur Backend

## ⚠️ IMPORTANT : Redémarrage Requis

Après avoir ajouté les credentials CMI au fichier `.env`, vous **DEVEZ** redémarrer le serveur backend pour que les nouvelles variables d'environnement soient chargées.

## Instructions

1. **Arrêter le serveur backend** (si en cours d'exécution)
   - Dans le terminal où le serveur tourne, appuyez sur `Ctrl + C`

2. **Redémarrer le serveur**
   ```bash
   cd morthai-backend
   npm run dev
   ```

3. **Vérifier que le serveur démarre correctement**
   - Vous devriez voir : `Server running on port 3001` ou un message similaire
   - Vérifiez qu'il n'y a pas d'erreurs dans la console

## Vérification

Une fois le serveur redémarré :

1. Retournez sur votre page de réservation
2. Sélectionnez "Payer en ligne"
3. Remplissez le formulaire et cliquez sur "CONFIRMER LA COMMANDE"
4. Vous devriez être redirigé vers la page de paiement CMI (au lieu de voir l'erreur)

## Si le problème persiste

- Vérifiez que le serveur backend est bien démarré
- Vérifiez les logs du serveur backend pour d'éventuelles erreurs
- Assurez-vous que les credentials CMI sont bien dans le fichier `.env`


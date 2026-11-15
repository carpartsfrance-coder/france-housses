# Mettre en ligne le nouveau site France Housses

Le nouveau site reprend le code de LEDVROOM (même design, même back-office) avec
le catalogue de france-housses.fr : 4 133 produits, leurs déclinaisons (couleurs,
nombre de places), leurs photos, les marques et modèles de véhicules, et les
questionnaires « sur mesure ».

Rien n'a été touché sur l'ancien site : il reste en ligne tant que vous ne
changez pas le domaine.

---

## 1. Créer le site sur Render (≈ 15 min)

1. Sur Render : **New → Blueprint**, choisir le dépôt
   `carpartsfrance-coder/france-housses`, branche `main`.
2. Render crée trois éléments : `fh-db` (la base), `fh-web` (le site) et
   `fh-jobs` (les tâches de fond : e-mails, imports).
3. Remplir les valeurs demandées (celles marquées « sync: false ») :

| Variable | Quoi mettre |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | d'abord l'adresse Render (`https://fh-web.onrender.com`), puis `https://www.france-housses.fr` le jour de la bascule |
| `MEDIA_*` | un bucket Cloudflare R2 **dédié à France Housses** (comme pour LEDVROOM, mais un autre bucket) |
| `MOLLIE_API_KEY` | la clé **live** d'un compte Mollie **au nom de France Housses** (pas celui de Car Parts France) |
| `EMAIL_FROM` / `EMAIL_API_KEY` | MailerSend avec le domaine `france-housses.fr` vérifié, expéditeur `contact@france-housses.fr` |
| `JOB_RUNNER_TOKEN` | Render le génère tout seul |

`NEXT_PUBLIC_DEMO_MODE` reste à **on** : le site n'est pas indexé par Google
tant que l'ancien site est en ligne (sinon contenu en double).

## 2. Remplir la base (≈ 1 h, une seule fois)

Dans Render, ouvrir le **Shell** de `fh-web` et lancer, dans l'ordre :

```bash
npm run seed                      # réglages, livraison, pages d'accueil
npm run import:france-housses     # catégories, véhicules, produits, photos (≈ 45 min)
npm run admin:create              # votre compte d'administration
```

L'import télécharge les photos depuis france-housses.fr : il faut donc le lancer
**avant** de couper l'ancien site. Il peut être relancé sans risque (il met à jour,
il ne duplique pas).

## 3. Vérifier (≈ 30 min)

- Chercher votre véhicule (ex. Renault Clio 4) et ouvrir une housse.
- Passer une commande test avec une housse « à la commande » : le questionnaire
  doit apparaître dans le panier, puis dans le back-office (Commandes et
  Préparation).
- Back-office → **Paramètres → État de l'installation** : la liste dit ce qui
  manque encore.
- **Livraison** : les prix (Colissimo 9,90 € France, 14,90 € Belgique/Luxembourg)
  sont des valeurs de départ, à corriger dans le back-office.

## 4. Basculer le domaine (le jour J)

1. Dans Render (`fh-web` → Settings → Custom Domains) : ajouter
   `www.france-housses.fr` et `france-housses.fr`.
2. Chez le registraire du domaine : faire pointer les enregistrements DNS vers
   Render (Render affiche les valeurs exactes). Garder les enregistrements MX
   (e-mails) tels quels.
3. Changer `NEXT_PUBLIC_SITE_URL` en `https://www.france-housses.fr` et
   `NEXT_PUBLIC_DEMO_MODE` en `off` (dans `render.yaml`, puis synchroniser).
4. Google Search Console : envoyer le nouveau sitemap
   (`https://www.france-housses.fr/sitemap.xml`).

Les anciennes adresses (fiches produit en `.html`, pages véhicules
`/vehicules/housses-sieges-auto/…/productlist`, catégories `/12-…`, pages
`/content/…`) sont **redirigées automatiquement** vers les nouvelles (301) :
le référencement Google est conservé.

## 5. À décider ou à fournir

- **Médiateur de la consommation** : obligatoire pour vendre à des particuliers.
  À renseigner dans `src/lib/identity.ts` (`mediator`).
- **Prix de livraison** définitifs, et seuil de livraison offerte s'il y en a un.
- **Paiement en 3 fois** : possible avec Mollie (Klarna/Alma) si vous le voulez.
- **Relecture des CGV** : elles excluent le sur mesure du droit de rétractation
  (article L221-28 3° du code de la consommation). À faire valider.
- **Boutique pro** (pro.france-housses.fr) : retirée du site comme demandé.
- **Anciens comptes clients et commandes** : non repris (départ à zéro, comme
  demandé). Les clients recréent un compte à leur prochaine commande.

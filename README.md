# yf-api
API for Yoshi Family team  
  
Version : 1.0  
Creator : PillouMK (https://github.com/PillouMK)  
Collaborator : AlanNegroni (https://github.com/AlanNegroni)
## FR :  
L'API a été pensée et développée dans le but de faciliter la gestion des données en lien avec la team Mario Kart (classements, contre-la-montre, joueurs, statistique des maps etc.).  
Initialement créé pour être utilisée par un Bot Discord sur le serveur de l'équipe, elle sera également utilisée dans une Application Mobile (en cours de développement).  
L'API a été développée en **Javascript** à l'aide du package Express JS (https://github.com/expressjs/express).
  
Aucune données sensibles n'est stockée avec cette API.

### Utilisation :
Toutes les requêtes nécessitent l'utilisation d'une clé nommée **api-key** à l'exception des requêtes GET.  
La documentation de l'API est disponible : https://github.com/PillouMK/yf-api/blob/main/yf_api_doc.yaml téléchargez et utilisez la dans l'editeur Swagger.io (https://editor.swagger.io).  
La clé d'API "api-key" ne peut être distribué puisqu'elle concerne la partie de l'API privée. 

### Ressources :
L'API contient 5 ressources : Player, Map, Timetrial, Roster, ProjetMap :  
- **Player** : Les joueurs présent sur le serveur Discord de la Yoshi Family
- **Map** : Toutes les courses présente dans le jeu Mario Kart 8 Deluxe
- **Timetrial** : Données des contre-la-montre des différents joueurs
- **Roster** : La team possède deux roster distinct **Galaxy** et **Odyssey**, il existe aussi un 3ème roster nommé **No Roster** afin de différencier les joueurs présent dans la team des autres
- **ProjectMap** : Enesmbles des statistique (score moyen par course) des deux rosters sur les différentes courses du jeu  

Pour plus de détail, consultez la documentation.
****
## ENG :
The API was designed and developed to facilitate the management of data related to the Mario Kart team (rankings, time trials, players, map statistics, etc.).  
Initially created to be used by a Discord bot on the team's server, it will also be used in a mobile application (in development).  
The API was developed in Javascript using the Express JS package (https://github.com/expressjs/express).   
   
No sensitive data is stored with this API.

### Usage: 
All requests require the use of an api-key named key, except for GET requests.     
The API documentation is available at https://github.com/PillouMK/yf-api/blob/main/yf_api_doc.yaml, download and use it in the Swagger.io editor (https://editor.swagger.io). The "api-key" API key cannot be distributed because it concerns the private part of the API.

### Resources: 
The API contains 5 resources: Player, Map, Timetrial, Roster, ProjetMap:
- **Player** : Players on the Yoshi Family Discord server
- **Map** : All races in the game Mario Kart 8 Deluxe
- **Timetrial** : Time trial data for various players
- **Roster** : The team has two distinct rosters, **Galaxy** and **Odyssey**, there is also a third roster called **No Roster** to differentiate players in the team from others
- **ProjectMap** : Statistics (average score by map) of the two rosters on the different races of the game  
For more details, see the documentation.

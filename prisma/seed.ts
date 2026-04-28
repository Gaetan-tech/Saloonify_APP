import { PrismaClient, Role, BookingStatut } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  await prisma.review.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.horaire.deleteMany();
  await prisma.prestation.deleteMany();
  await prisma.salon.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('password123', 10);

  const coiffeur1 = await prisma.user.create({
    data: {
      email: 'marie.dupont@saloonify.fr',
      password: passwordHash,
      role: Role.COIFFEUR,
      nom: 'Dupont',
      prenom: 'Marie',
      avatar: 'https://i.pravatar.cc/150?img=47',
    },
  });

  const coiffeur2 = await prisma.user.create({
    data: {
      email: 'ahmed.benali@saloonify.fr',
      password: passwordHash,
      role: Role.COIFFEUR,
      nom: 'Benali',
      prenom: 'Ahmed',
      avatar: 'https://i.pravatar.cc/150?img=12',
    },
  });

  const coiffeur3 = await prisma.user.create({
    data: {
      email: 'sofia.martin@saloonify.fr',
      password: passwordHash,
      role: Role.COIFFEUR,
      nom: 'Martin',
      prenom: 'Sofia',
      avatar: 'https://i.pravatar.cc/150?img=25',
    },
  });

  const clients = await Promise.all([
    prisma.user.create({
      data: {
        email: 'client1@example.com',
        password: passwordHash,
        role: Role.CLIENT,
        nom: 'Bernard',
        prenom: 'Lucie',
        avatar: 'https://i.pravatar.cc/150?img=5',
      },
    }),
    prisma.user.create({
      data: {
        email: 'client2@example.com',
        password: passwordHash,
        role: Role.CLIENT,
        nom: 'Moreau',
        prenom: 'Thomas',
        avatar: 'https://i.pravatar.cc/150?img=8',
      },
    }),
    prisma.user.create({
      data: {
        email: 'client3@example.com',
        password: passwordHash,
        role: Role.CLIENT,
        nom: 'Petit',
        prenom: 'Amina',
        avatar: 'https://i.pravatar.cc/150?img=44',
      },
    }),
    prisma.user.create({
      data: {
        email: 'client4@example.com',
        password: passwordHash,
        role: Role.CLIENT,
        nom: 'Rousseau',
        prenom: 'Kevin',
        avatar: 'https://i.pravatar.cc/150?img=15',
      },
    }),
    prisma.user.create({
      data: {
        email: 'client5@example.com',
        password: passwordHash,
        role: Role.CLIENT,
        nom: 'Leroy',
        prenom: 'Isabelle',
        avatar: 'https://i.pravatar.cc/150?img=32',
      },
    }),
  ]);

  const jours = ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI'];

  // Salon 1 - Marie, spécialiste tresses, Châtelet
  const salon1 = await prisma.salon.create({
    data: {
      nom: 'Salon Marie - Tresses & Beauté',
      description:
        'Spécialiste des tresses africaines, box braids et coiffures naturelles depuis 10 ans. Un espace chaleureux au cœur de Paris où chaque cliente est reine.',
      adresse: '12 Rue de Rivoli, 75001 Paris',
      lat: 48.8603,
      lng: 2.3477,
      photos: [
        'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800',
        'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800',
        'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=800',
      ],
      coiffeurId: coiffeur1.id,
      horaires: {
        create: jours.map((jour) => ({
          jour,
          ouvert: true,
          heureDebut: '09:00',
          heureFin: '19:00',
        })),
      },
      prestations: {
        create: [
          { nom: 'Box Braids', description: 'Tresses box braids longues ou courtes', duree: 180, prix: 120, categorie: 'Tresses' },
          { nom: 'Fulani Braids', description: 'Tresses fulani avec perles', duree: 150, prix: 100, categorie: 'Tresses' },
          { nom: 'Coupe & Brushing', description: 'Coupe et mise en forme au brushing', duree: 60, prix: 45, categorie: 'Coupe' },
          { nom: 'Lissage kératine', description: 'Lissage brésilien longue durée', duree: 120, prix: 90, categorie: 'Lissage' },
          { nom: 'Locks débutantes', description: 'Pose de dreadlocks depuis zéro', duree: 240, prix: 160, categorie: 'Locks' },
        ],
      },
    },
  });

  // Salon 2 - Ahmed, coiffure mixte, Montmartre
  const salon2 = await prisma.salon.create({
    data: {
      nom: 'Coiffure Parisienne by Ahmed',
      description:
        'Expert en colorations, mèches et techniques de pointe. Votre nouveau look à Montmartre dans un studio moderne et artistique. Homme, femme, enfant — bienvenue.',
      adresse: '8 Rue Lepic, 75018 Paris',
      lat: 48.8867,
      lng: 2.3431,
      photos: [
        'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=800',
        'https://images.unsplash.com/photo-1504703395950-b89145a5425b?w=800',
        'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=800',
      ],
      coiffeurId: coiffeur2.id,
      horaires: {
        create: [
          ...jours.map((jour) => ({
            jour,
            ouvert: true,
            heureDebut: '10:00',
            heureFin: '20:00',
          })),
          { jour: 'DIMANCHE', ouvert: false, heureDebut: null, heureFin: null },
        ],
      },
      prestations: {
        create: [
          { nom: 'Coupe Homme', description: 'Coupe classique ou moderne pour homme', duree: 30, prix: 22, categorie: 'Coupe' },
          { nom: 'Coupe + Barbe', description: 'Coupe homme et taille de barbe', duree: 45, prix: 32, categorie: 'Coupe' },
          { nom: 'Balayage', description: 'Balayage naturel ou contrasté', duree: 90, prix: 75, categorie: 'Couleur' },
          { nom: 'Coloration complète', description: 'Couleur totale avec soin', duree: 90, prix: 65, categorie: 'Couleur' },
          { nom: 'Mèches courtes', description: 'Mèches et reflets pour cheveux courts', duree: 60, prix: 55, categorie: 'Couleur' },
        ],
      },
    },
  });

  // Salon 3 - Sofia, afro & urban, Bastille
  const salon3 = await prisma.salon.create({
    data: {
      nom: 'Studio Urban Coiffure',
      description:
        'Studio branché spécialisé en coiffures afro, urbaines et créatives. Curl by curl, wash & go, twist out — toutes les techniques pour sublimer vos cheveux naturels.',
      adresse: '35 Rue de la Roquette, 75011 Paris',
      lat: 48.8533,
      lng: 2.3692,
      photos: [
        'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=800',
        'https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=800',
        'https://images.unsplash.com/photo-1599566219227-2efe0c9b7f5f?w=800',
      ],
      coiffeurId: coiffeur3.id,
      horaires: {
        create: jours.map((jour) => ({
          jour,
          ouvert: true,
          heureDebut: '09:30',
          heureFin: '18:30',
        })),
      },
      prestations: {
        create: [
          { nom: 'Twist Out', description: 'Mise en forme twist out sur cheveux naturels', duree: 90, prix: 55, categorie: 'Naturel' },
          { nom: 'Wash & Go', description: 'Lavage, soin et définition des boucles', duree: 60, prix: 40, categorie: 'Naturel' },
          { nom: 'Coupe femme', description: 'Coupe sur cheveux crépus ou bouclés', duree: 60, prix: 35, categorie: 'Coupe' },
          { nom: 'Soin protéiné', description: 'Masque protéiné reconstituant', duree: 45, prix: 30, categorie: 'Soin' },
          { nom: 'Défrisage', description: 'Défrisage et lissage chimique', duree: 120, prix: 80, categorie: 'Chimique' },
        ],
      },
    },
  });

  const reviewsData = [
    { note: 5, commentaire: 'Incroyable ! Marie est une vraie artiste, mes box braids tiennent depuis 6 semaines !' },
    { note: 5, commentaire: 'Accueil chaleureux, résultat parfait. Je reviendrai sans hésiter.' },
    { note: 4, commentaire: 'Très bon travail sur mes locks, juste un peu de retard mais ça valait le coup.' },
    { note: 5, commentaire: 'La meilleure coiffeuse de Paris pour les tresses africaines. Tarifs justes.' },
    { note: 4, commentaire: 'Salon propre et bien équipé. Ma fille a adoré sa coiffure.' },
  ];

  for (let i = 0; i < 5; i++) {
    await prisma.review.create({
      data: {
        note: reviewsData[i].note,
        commentaire: reviewsData[i].commentaire,
        clientId: clients[i].id,
        salonId: salon1.id,
      },
    });
  }

  await prisma.salon.update({
    where: { id: salon1.id },
    data: { note: 4.6, totalAvis: 5 },
  });

  const reviews2 = [
    { note: 5, commentaire: 'Ahmed est un génie de la couleur ! Mon balayage est exactement ce que je voulais.' },
    { note: 4, commentaire: 'Coupe homme bien exécutée, propre et rapide. Bonne adresse.' },
    { note: 5, commentaire: 'Je viens pour ma coloration depuis 2 ans, toujours parfait.' },
    { note: 4, commentaire: 'Très pro, salon moderne. Seul bémol : c\'est parfois dur d\'avoir un RDV.' },
    { note: 5, commentaire: 'Les mèches sont superbes, exactement la tendance que je cherchais.' },
  ];

  for (let i = 0; i < 5; i++) {
    await prisma.review.create({
      data: {
        note: reviews2[i].note,
        commentaire: reviews2[i].commentaire,
        clientId: clients[i].id,
        salonId: salon2.id,
      },
    });
  }

  await prisma.salon.update({
    where: { id: salon2.id },
    data: { note: 4.6, totalAvis: 5 },
  });

  const reviews3 = [
    { note: 5, commentaire: 'Sofia est la reine du wash & go ! Mes boucles n\'ont jamais été aussi belles.' },
    { note: 5, commentaire: 'Enfin un salon qui comprend les cheveux afro ! Technique parfaite.' },
    { note: 4, commentaire: 'Bonne coupe, soin de qualité. Tarifs raisonnables pour Paris.' },
    { note: 5, commentaire: 'Mon twist out était parfait, plein de compliments ce weekend !' },
    { note: 3, commentaire: 'Bon service mais j\'aurais aimé plus de conseils personnalisés pour mon type de cheveux.' },
  ];

  for (let i = 0; i < 5; i++) {
    await prisma.review.create({
      data: {
        note: reviews3[i].note,
        commentaire: reviews3[i].commentaire,
        clientId: clients[i].id,
        salonId: salon3.id,
      },
    });
  }

  await prisma.salon.update({
    where: { id: salon3.id },
    data: { note: 4.4, totalAvis: 5 },
  });

  // Sample bookings
  const prestations1 = await prisma.prestation.findMany({ where: { salonId: salon1.id } });
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);

  await prisma.booking.create({
    data: {
      clientId: clients[0].id,
      salonId: salon1.id,
      prestationId: prestations1[0].id,
      dateHeure: tomorrow,
      statut: BookingStatut.CONFIRME,
    },
  });

  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  nextWeek.setHours(14, 0, 0, 0);

  await prisma.booking.create({
    data: {
      clientId: clients[1].id,
      salonId: salon1.id,
      prestationId: prestations1[1].id,
      dateHeure: nextWeek,
      statut: BookingStatut.EN_ATTENTE,
    },
  });

  console.log('Database seeded successfully!');
  console.log(`Created: 3 coiffeurs, 5 clients, 3 salons, 15 reviews, 2 bookings`);
  console.log('\nTest credentials:');
  console.log('  Coiffeur: marie.dupont@saloonify.fr / password123');
  console.log('  Coiffeur: ahmed.benali@saloonify.fr / password123');
  console.log('  Coiffeur: sofia.martin@saloonify.fr / password123');
  console.log('  Client: client1@example.com / password123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

-- Seed data — i will run this last, after all three migrations.

insert into resources (name, type, capacity, description) values
  ('Main Hall', 'room', 80, 'Large multipurpose hall for events and youth programmes'),
  ('Meeting Room A', 'room', 12, 'Small meeting room, whiteboard and projector'),
  ('Gym Floor', 'room', 20, 'Open gym space for fitness sessions'),
  ('Projector Kit', 'equipment', null, 'Portable projector and screen, bookable separately from rooms'),
  ('Sound System', 'equipment', null, 'PA speaker set with two microphones');

insert into campaigns (title, goal_amount, current_amount, active) values
  ('Winter Food Parcels 2026', 50000.00, 0, true);

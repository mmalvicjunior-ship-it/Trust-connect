export const SERVICES = [
  { icon: 'fa-bolt', img: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&h=260&fit=crop', title: 'Electricians', desc: 'Wiring, installations and urgent electrical repairs.' },
  { icon: 'fa-faucet', img: 'https://images.unsplash.com/photo-1607472829078-8f9de9134155?w=400&h=260&fit=crop', title: 'Plumbers', desc: 'Leaks, blockages and full bathroom installations.' },
  { icon: 'fa-car-wrench', img: 'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?w=400&h=260&fit=crop', title: 'Mechanics', desc: 'Diagnostics, servicing and roadside assistance.' },
  { icon: 'fa-broom', img: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&h=260&fit=crop', title: 'Cleaners', desc: 'Deep cleans, offices and move-in/move-out service.' },
  { icon: 'fa-paint-roller', img: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=400&h=260&fit=crop', title: 'Painters', desc: 'Interior and exterior painting, done neatly.' },
  { icon: 'fa-hammer', img: 'https://images.unsplash.com/photo-1622021142947-da7dedc7c39a?w=400&h=260&fit=crop', title: 'Carpenters', desc: 'Custom furniture, repairs and fittings.' },
  { icon: 'fa-seedling', img: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=260&fit=crop', title: 'Gardeners', desc: 'Landscaping, lawn care and upkeep.' },
  { icon: 'fa-blender', img: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=400&h=260&fit=crop', title: 'Appliance Repair', desc: 'Fridges, washers and ovens fixed fast.' },
  { icon: 'fa-fan', img: 'https://images.unsplash.com/photo-1631545806609-27e3a3897a17?w=400&h=260&fit=crop', title: 'Air Conditioning', desc: 'Installation, servicing and regassing.' },
  { icon: 'fa-video', img: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=400&h=260&fit=crop', title: 'Security Installation', desc: 'Alarms, access control and locks.' },
  { icon: 'fa-camera', img: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=400&h=260&fit=crop', title: 'CCTV', desc: 'Camera systems for homes and businesses.' },
  { icon: 'fa-solar-panel', img: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=400&h=260&fit=crop', title: 'Solar Installation', desc: 'Panels, batteries and backup power.' },
  { icon: 'fa-network-wired', img: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=260&fit=crop', title: 'IT Support', desc: 'Networks, hardware and helpdesk cover.' },
  { icon: 'fa-toolbox', img: 'https://images.unsplash.com/photo-1620626011761-996317b8d101?w=400&h=260&fit=crop', title: 'General Handyman', desc: 'Small jobs and fixes around the property.' },
  { icon: 'fa-bug', img: 'https://images.unsplash.com/photo-1632923790909-16d0e1a70762?w=400&h=260&fit=crop', title: 'Pest Control', desc: 'Safe, effective treatment for any infestation.' },
];

export const PROVIDERS = [
  { img: 'https://randomuser.me/api/portraits/men/32.jpg', name: 'James O.', trade: 'Electrician', rating: 4.9, reviews: 214, years: 8 },
  { img: 'https://randomuser.me/api/portraits/women/44.jpg', name: 'Nyasha D.', trade: 'Cleaner', rating: 5.0, reviews: 301, years: 5 },
  { img: 'https://randomuser.me/api/portraits/men/65.jpg', name: 'Farai T.', trade: 'Plumber', rating: 4.8, reviews: 176, years: 11 },
  { img: 'https://randomuser.me/api/portraits/women/68.jpg', name: 'Chipo M.', trade: 'Painter', rating: 4.9, reviews: 132, years: 6 },
];

export const PROVIDERS_DETAIL = [
  { name: 'John Plumbing Services', specialty: 'Plumber', icon: 'fas fa-wrench', location: 'Harare, Zimbabwe', rating: 4.9, bio: '10+ years of experience in residential and commercial plumbing.', tags: ['Pipe Repair', 'Installation', 'Emergency'] },
  { name: 'FastFix Mechanics', specialty: 'Mechanic', icon: 'fas fa-car', location: 'Harare, Zimbabwe', rating: 4.8, bio: 'Specializing in engine repair, diagnostics, and maintenance.', tags: ['Engine Repair', 'Diagnostics', 'Maintenance'] },
  { name: 'BrightSpark Electric', specialty: 'Electrician', icon: 'fas fa-bolt', location: 'Bulawayo, Zimbabwe', rating: 4.7, bio: 'Certified electrician with expertise in residential and commercial wiring.', tags: ['Wiring', 'Lighting', 'Security'] },
  { name: 'Premier Home Repairs', specialty: 'Handyman', icon: 'fas fa-house', location: 'Harare, Zimbabwe', rating: 4.9, bio: 'General home repairs, renovations, and maintenance services.', tags: ['Painting', 'Carpentry', 'Renovations'] },
  { name: 'GreenThumb Landscaping', specialty: 'Landscaper', icon: 'fas fa-tree', location: 'Harare, Zimbabwe', rating: 4.8, bio: 'Creating beautiful outdoor spaces with expert gardening and landscaping.', tags: ['Garden Design', 'Lawn Care', 'Irrigation'] },
  { name: 'Appliance Pro Repairs', specialty: 'Appliance Technician', icon: 'fas fa-tools', location: 'Bulawayo, Zimbabwe', rating: 4.6, bio: 'Expert repair for all major home appliances.', tags: ['Refrigerators', 'Washers', 'AC Units'] },
];

export const SERVICES_DETAIL = [
  { title: 'Electricians', icon: 'fas fa-bolt', desc: 'Certified electricians for safe and reliable electrical work.', items: ['Wiring and rewiring', 'Lighting installation', 'Circuit breaker repair', 'Electrical safety inspections'], btnText: 'Book an Electrician' },
  { title: 'Plumbers', icon: 'fas fa-wrench', desc: 'Reliable plumbing services for repairs, installations, and maintenance.', items: ['Leak detection and repair', 'Pipe installation and replacement', 'Water heater services', 'Drain cleaning and unblocking'], btnText: 'Book a Plumber' },
  { title: 'Mechanics', icon: 'fas fa-car', desc: 'Expert automotive care to keep your vehicle running smoothly.', items: ['Engine diagnostics and repair', 'Brake and clutch services', 'Oil changes and maintenance', 'Electrical system repair'], btnText: 'Book a Mechanic' },
  { title: 'Cleaners', icon: 'fas fa-broom', desc: 'Trusted cleaning for homes, offices, and move-in or move-out needs.', items: ['Home deep cleaning', 'Office cleaning', 'Move-in and move-out cleaning', 'Window and surface cleaning'], btnText: 'Book a Cleaner' },
  { title: 'Painters', icon: 'fas fa-paint-roller', desc: 'Careful interior and exterior painting for homes and businesses.', items: ['Interior painting', 'Exterior painting', 'Surface preparation', 'Touch-ups and repainting'], btnText: 'Book a Painter' },
  { title: 'Carpenters', icon: 'fas fa-hammer', desc: 'Custom carpentry, furniture repairs, and practical fittings.', items: ['Custom furniture', 'Cabinet and door repairs', 'Shelving and fittings', 'Woodwork installation'], btnText: 'Book a Carpenter' },
  { title: 'Gardeners', icon: 'fas fa-seedling', desc: 'Regular garden care and landscaping to keep outdoor spaces in shape.', items: ['Lawn care and mowing', 'Garden maintenance', 'Planting and pruning', 'Landscape improvements'], btnText: 'Book a Gardener' },
  { title: 'Appliance Repair', icon: 'fas fa-tools', desc: 'Professional repair services for major household appliances.', items: ['Refrigerator and freezer repair', 'Washing machine service', 'Oven and stove repair', 'Appliance diagnostics'], btnText: 'Book Appliance Repair' },
  { title: 'Air Conditioning', icon: 'fas fa-fan', desc: 'Air conditioning installation, servicing, and repair.', items: ['AC installation', 'Routine servicing', 'Fault diagnosis and repair', 'Regassing'], btnText: 'Book AC Service' },
  { title: 'Security Installation', icon: 'fas fa-shield-alt', desc: 'Security systems and access solutions for homes and businesses.', items: ['Alarm installation', 'Access control', 'Security locks', 'System maintenance'], btnText: 'Book Security Installation' },
  { title: 'CCTV', icon: 'fas fa-video', desc: 'Camera systems to help monitor homes and business premises.', items: ['Camera installation', 'System configuration', 'Recording setup', 'CCTV maintenance'], btnText: 'Book CCTV Service' },
  { title: 'Solar Installation', icon: 'fas fa-solar-panel', desc: 'Solar panels, battery systems, and backup power solutions.', items: ['Solar panel installation', 'Battery setup', 'Inverter installation', 'System inspection'], btnText: 'Book Solar Installation' },
  { title: 'IT Support', icon: 'fas fa-network-wired', desc: 'Practical technology support for networks, devices, and businesses.', items: ['Computer troubleshooting', 'Network setup', 'Hardware support', 'Business helpdesk assistance'], btnText: 'Book IT Support' },
  { title: 'General Handyman', icon: 'fas fa-toolbox', desc: 'Reliable help with small repairs and maintenance around your property.', items: ['Minor home repairs', 'Fixture installation', 'Basic maintenance', 'Assembly and fitting'], btnText: 'Book a Handyman' },
  { title: 'Pest Control', icon: 'fas fa-bug', desc: 'Pest inspection and treatment for residential and commercial spaces.', items: ['Pest inspection', 'Treatment planning', 'Preventive pest control', 'Follow-up service'], btnText: 'Book Pest Control' },
];

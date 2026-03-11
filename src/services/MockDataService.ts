export type Industry = 'tech' | 'fashion' | 'finance' | 'health' | 'generic';

export class MockDataService {
    private static industry: Industry = 'generic';

    static setIndustry(ind: Industry) {
        this.industry = ind;
    }

    static getCompetitors() {
        const data = {
            tech: ['Cyberdyne Systems', 'Hooli', 'Massive Dynamic'],
            fashion: ['Derelicte', 'Mugatu', 'Runway'],
            finance: ['Gekko & Co', 'Duke & Duke', 'Pierce & Pierce'],
            health: ['Umbrella Corp', 'InGen', 'Oscorp'],
            generic: ['Competitor A', 'Competitor B', 'Competitor C']
        };
        return data[this.industry] || data.generic;
    }

    static getTrends() {
        const data = {
            tech: ['AI is rising', 'Privacy concerns', 'Cloud adoption'],
            fashion: ['Sustainability', 'Retro revival', 'Digital fashion'],
            finance: ['Crypto regulation', 'Mobile banking', 'ESG investing'],
            health: ['Telehealth', 'Personalized medicine', 'Wearables'],
            generic: ['Rising demand', 'Cost efficiency', 'Digital transformation']
        };
        return data[this.industry] || data.generic;
    }

    static getPersonas() {
        const data = {
            tech: [
                { name: 'DevOps Dave', traits: ['Efficiency-focused', 'Skeptical of hype'] },
                { name: 'CTO Sarah', traits: ['Strategic', 'Budget-conscious'] }
            ],
            fashion: [
                { name: 'Trendsetter Tina', traits: ['Visual-first', 'Early adopter'] },
                { name: 'Eco-conscious Earl', traits: ['Ethical sourcing', 'Quality over quantity'] }
            ],
            // ... expand as needed
            generic: [
                { name: 'Value Victor', traits: ['Price sensitive'] },
                { name: 'Quality Quinn', traits: ['Performance focused'] }
            ]
        } as Record<string, { name: string; traits: string[] }[]>;

        const personas = data[this.industry] || data.generic;
        return personas.map((p: { name: string; traits: string[] }) => ({
            ...p,
            id: Math.random().toString(36).substring(7)
        }));
    }

    static generateCreativeVariants(product: string, audience: string, platform: string) {
        const p = product || "Product";
        const a = audience || "Customers";
        const baseImg = "Dark blue background, calm mood, premium feel.";

        // Industry-specific templates
        const templates: Record<Industry, any[]> = {
            tech: [
                {
                    headline: `Build the Future with ${p}.`,
                    body: `The ultimate tool for ${a} who demand precision and performance.`,
                    visualDescription: `Close-up macro shot of ${p} showing intricate circuits or metallic details. ${baseImg}`,
                    rationale: 'Feature-led: Emphasis on technical specs and build quality.'
                },
                {
                    headline: `Seamless Integration. Zero Friction.`,
                    body: `${p} connects your workflow instantly. Stop fighting your tools.`,
                    visualDescription: `Split screen: Complex wireframe vs Clean UI of ${p} on a floating screen.`,
                    rationale: 'Problem-solution: Addressing integration pain points.'
                },
                {
                    headline: `Code Less. Create More.`,
                    body: `Unleash your potential with ${p}'s automated intelligence.`,
                    visualDescription: `Developer typing on a holographic keyboard with ${p} glow in background.`,
                    rationale: 'Benefit-led: Focusing on productivity and creative output.'
                },
                {
                    headline: `Trusted by the Fortune 500.`,
                    body: `Join the elite teams deployment ${p} at scale.`,
                    visualDescription: `Logo wall overlay on a server room background with ${p} icon pulsing.`,
                    rationale: 'Social Proof: Enterprise reliability and trust.'
                },
                {
                    headline: `The New Standard in Tech.`,
                    body: `Don't get left behind. Upgrade to ${p} today.`,
                    visualDescription: `Futuristic city skyline with ${p} projected on a skyscraper.`,
                    rationale: 'FOMO/Trend: Positioning as the industry standard.'
                }
            ],
            fashion: [
                {
                    headline: `Wear Your Story with ${p}.`,
                    body: `For ${a} who speak without saying a word.`,
                    visualDescription: `Model wearing ${p} in a sunlit urban street, confident pose.`,
                    rationale: 'Identity-led: Fashion as self-expression.'
                },
                {
                    headline: `Sustainable Luxury: ${p}.`,
                    body: `Crafted with care, designed for forever.`,
                    visualDescription: `Close up of fabric texture of ${p} with natural lighting and green leaf shadow.`,
                    rationale: 'Values-led: Emphasis on sustainability and quality.'
                },
                {
                    headline: `The ${p} Collection Drop.`,
                    body: `Limited edition. Exclusive access. Get it before it's gone.`,
                    visualDescription: `Silhouette of ${p} with countdown timer and neon accents.`,
                    rationale: 'Scarcity: Creating urgency for the drop.'
                },
                {
                    headline: `Seen on the Runway.`,
                    body: `The piece everyone is talking about. Make it yours.`,
                    visualDescription: `Paparazzi flash style photo of ${p} being worn at a gala.`,
                    rationale: 'Social Proof: High-status validation.'
                },
                {
                    headline: `Effortless Style.`,
                    body: `Morning meetings to evening drinks. ${p} does it all.`,
                    visualDescription: `Day-to-night transition animation split of ${p}.`,
                    rationale: 'Utility/Versatility: showcasing practical usage.'
                }
            ],
            finance: [
                { headline: `Grow Wealth with ${p}.`, body: `Smart automated investing for ${a}.`, visualDescription: `Rising graph curve overlaid on ${p} interface.`, rationale: 'Benefit: Wealth generation.' },
                { headline: `Secure Your Future.`, body: `Bank-grade security meets user-friendly design in ${p}.`, visualDescription: `Shield icon morphing into ${p} logo.`, rationale: 'Trust: Security focus.' },
                { headline: `Market Mastery.`, body: `Trade like a pro with real-time insights from ${p}.`, visualDescription: `Trader with multiple monitors showing green signals on ${p}.`, rationale: 'Competence: Professional tools.' },
                { headline: `Fees are History.`, body: `Keep more of what you earn with ${p}.`, visualDescription: `Percent sign shattering into dust revealing ${p}.`, rationale: 'Cost-saving: Direct value prop.' },
                { headline: `Join the 1%.`, body: `Exclusive access to premium assets via ${p}.`, visualDescription: `Gold card texture background with ${p} embossed.`, rationale: 'Status: Exclusivity.' }
            ],
            health: [
                { headline: `Vitality Reimagined: ${p}.`, body: `Your daily dose of wellness.`, visualDescription: `Fresh water splash or organic ingredients surrounding ${p}.`, rationale: 'Wellness: Health focus.' },
                { headline: `Doctor Recommended.`, body: `The #1 choice for ${a} seeking recovery.`, visualDescription: `Stethoscope next to ${p} on a clean white surface.`, rationale: 'Authority: Medical trust.' },
                { headline: `Feel Better, Faster.`, body: `Proven results in just 7 days with ${p}.`, visualDescription: `Time-lapse of recovery/improvement graph with ${p}.`, rationale: 'Efficacy: Speed of results.' },
                { headline: `Nature x Science.`, body: `The best of both worlds in ${p}.`, visualDescription: `DNA helix intertwining with a leaf around ${p}.`, rationale: 'Ingredients: Natural + Effective.' },
                { headline: `Your Health Partner.`, body: `24/7 monitoring and support with ${p}.`, visualDescription: `Smart watch interface showing heart rate synced to ${p}.`, rationale: 'Support: Always on.' as string }
            ],
            generic: [
                {
                    headline: `Experience ${p}.`,
                    body: `The ultimate solution for ${a} demanding quality.`,
                    visualDescription: `Product hero shot of ${p} on dark background.`,
                    rationale: 'Generic Quality'
                },
                {
                    headline: `Why Settle? Choose ${p}.`,
                    body: `Upgrade your experience today.`,
                    visualDescription: `Comparison checkmarks showing ${p} winning.`,
                    rationale: 'Comparison'
                },
                {
                    headline: `${p}: Validated by Experts.`,
                    body: `Join thousands of satisfied customers.`,
                    visualDescription: `5-star rating overlay on ${p}.`,
                    rationale: 'Social Proof'
                },
                {
                    headline: `The Future is ${p}.`,
                    body: `Innovation at your fingertips.`,
                    visualDescription: `Glowing futuristic lines forming ${p}.`,
                    rationale: 'Innovation'
                },
                {
                    headline: `Simplifying Life with ${p}.`,
                    body: `More time for what matters.`,
                    visualDescription: `Calm, organized lifestyle shot with ${p}.`,
                    rationale: 'Simplicity/Lifestyle'
                }
            ]
        };

        const selectedTemplates = templates[this.industry] || templates.generic;

        // Map templates to full creative objects with IDs and Platform
        return selectedTemplates.map((t, idx) => ({
            id: (idx + 1).toString(),
            headline: t.headline,
            body: t.body,
            cta: 'Learn More',
            visualDescription: t.visualDescription,
            platform: platform,
            rationale: t.rationale,
            // Use curated high-quality stock images based on industry and product context
            imageUrl: this.getRealStockImage(this.industry, idx, p)
        }));
    }

    private static getRealStockImage(ind: Industry, variantIndex: number, productName: string): string {
        const lowerProduct = productName.toLowerCase();

        // 1. Context-Aware Overrides (Keyword Matching)
        if (lowerProduct.includes('shoe') || lowerProduct.includes('sneaker') || lowerProduct.includes('boot') || lowerProduct.includes('footwear')) {
            const shoeImages = [
                'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80', // Red Nike
                'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?auto=format&fit=crop&w=1200&q=80', // Green Nike
                'https://images.unsplash.com/photo-1491553895911-0055eca6402d?auto=format&fit=crop&w=1200&q=80', // Running Shoe
                'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=1200&q=80', // White Sneaker
                'https://images.unsplash.com/photo-1543508282-6319a3e2621f?auto=format&fit=crop&w=1200&q=80'  // Dark Shoe
            ];
            return shoeImages[variantIndex % shoeImages.length];
        }

        if (lowerProduct.includes('headphone') || lowerProduct.includes('audio') || lowerProduct.includes('sound') || lowerProduct.includes('ear')) {
            const audioImages = [
                'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=80',
                'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=1200&q=80',
                'https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=1200&q=80',
                'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=1200&q=80'
            ];
            return audioImages[variantIndex % audioImages.length];
        }

        if (lowerProduct.includes('watch') || lowerProduct.includes('time')) {
            return 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=80';
        }

        // 2. Industry-Based Fallback
        const imageCollections: Record<Industry, string[]> = {
            tech: [
                'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80', // Team working
                'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1200&q=80', // Cyber/Tech
                'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80', // Chip/Circuit
                'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1200&q=80', // Laptop code
                'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80'  // Matrix code
            ],
            fashion: [
                'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=80', // Fashion model
                'https://images.unsplash.com/photo-1529139574466-a302c2d56aee?auto=format&fit=crop&w=1200&q=80', // Street style
                'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=80', // Fashion colorful
                'https://images.unsplash.com/photo-1539008835657-9e8e9680c956?auto=format&fit=crop&w=1200&q=80', // Elegant dress
                'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=80'  // Clothes rack
            ],
            finance: [
                'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=1200&q=80', // Stock chart
                'https://images.unsplash.com/photo-1565514020176-db792f0b65f7?auto=format&fit=crop&w=1200&q=80', // Coins/Graph
                'https://images.unsplash.com/photo-1554224155-9736b5cb7a55?auto=format&fit=crop&w=1200&q=80', // Calculator/Business
                'https://images.unsplash.com/photo-1620714223084-8fcacc6dfd8d?auto=format&fit=crop&w=1200&q=80', // Coins stack
                'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&w=1200&q=80'  // Money plant
            ],
            health: [
                'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=1200&q=80', // Yoga/Wellness
                'https://images.unsplash.com/photo-1544367563-12123d8965cd?auto=format&fit=crop&w=1200&q=80', // Spa/Water
                'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=1200&q=80', // Trainer
                'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?auto=format&fit=crop&w=1200&q=80', // Doctor
                'https://images.unsplash.com/photo-1511688878353-3a2f5be94cd7?auto=format&fit=crop&w=1200&q=80'  // Healthy food
            ],
            generic: [
                'https://images.unsplash.com/photo-1493612276216-9c78370631f3?auto=format&fit=crop&w=1200&q=80', // Modern lamp/Product
                'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=80', // Headphones
                'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=80', // Watch
                'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80', // Red Shoe
                'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=1200&q=80'  // Headphones
            ]
        };

        const collection = imageCollections[ind] || imageCollections.generic;
        return collection[variantIndex % collection.length];
    }
}

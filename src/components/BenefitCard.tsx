interface BenefitCardProps {
  image: string;
  title: string;
  description: string;
  delay?: number;
}

const BenefitCard = ({ image, title, description, delay = 0 }: BenefitCardProps) => {
  return (
    <div 
      className="bg-card rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 animate-fade-in-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="mb-6 flex justify-center">
        <div className="w-24 h-24 rounded-2xl overflow-hidden bg-surface flex items-center justify-center">
          <img 
            src={image} 
            alt={title}
            className="w-full h-full object-cover"
          />
        </div>
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-3 text-center">
        {title}
      </h3>
      <p className="text-muted-foreground text-center leading-relaxed">
        {description}
      </p>
    </div>
  );
};

export default BenefitCard;

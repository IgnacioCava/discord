import globe from "../../../../public/globe.svg";
import Image from "next/image";

const GlobeImage = ({
  width,
  height,
  className,
  alt,
}: {
  width?: number;
  height: number;
  className?: string;
  alt?: string;
}) => {
  return (
    <Image
      src={globe}
      alt={alt || "sample"}
      width={width}
      height={height}
      className={className}
    />
  );
};

export default GlobeImage;

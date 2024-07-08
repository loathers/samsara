import { Box } from "@chakra-ui/react";

export function ResponsiveContent({
  narrow,
  wide,
}: {
  narrow: React.ReactNode;
  wide: React.ReactNode;
}) {
  return (
    <>
      <Box as="span" display={["none", null, null, "inline"]}>
        {wide}
      </Box>
      <Box as="span" display={["inline", null, null, "none"]}>
        {narrow}
      </Box>
    </>
  );
}

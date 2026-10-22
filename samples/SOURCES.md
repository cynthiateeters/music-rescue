# Sample sources

Downloaded 2026-10-22 for local testing of homr-web. Rights are as stated by each source on that date.

On the `poc` branch, the pages the demo offers live in `public/samples/` so they ship with the site: The Kesh, Grand Staff Study and Chord Study (each with its `.expected.musicxml`), and The Star-Spangled Banner. The Bazzini and Bach scans stay here, out of the build, because they came out wrong. Their entries below still describe them.

## Baselines with expected output

These three come from the homr-web repo. Each has a `.expected.musicxml` file, which is what homr 0.7.0 writes for that page. If the prototype's output matches it, the prototype is wired up correctly.

- `the-kesh-300dpi.png` and `the-kesh-300dpi.expected.musicxml`
  - The Kesh Jig, a traditional Irish tune, typeset by the homr-web author. One melody line.
  - Source: https://github.com/jymen/homr-web/tree/main/test/fixtures (`test/golden/the-kesh-300dpi/page.musicxml`)
  - Rights: public-domain tune. The rendering is in an AGPL-3.0 repo.
- `grand-staff-300dpi.png` and `grand-staff-300dpi.expected.musicxml`
  - "Grand Staff Study", sixteen bars for piano, treble and bass staves.
  - Same source and rights as above.
- `chord-study-300dpi.png` and `chord-study-300dpi.expected.musicxml`
  - "Chord Study", sixteen bars with chord symbols over most of them.
  - Same source and rights as above.

## Scans of published scores

- `bazzini-ronde-des-lutins-p1.png`
  - Antonio Bazzini, La Ronde des Lutins, first page of the score (violin and piano). 1781 x 2363.
  - Source: https://commons.wikimedia.org/wiki/File:Antonio_Bazzini_–_La_Ronde_des_Lutins_(Dance_of_the_Goblins)_–_Score,_First_Page.png
  - Rights: public domain.
  - Has a transparency channel, so flatten it onto white before recognition, as homr-web's README advises.
- `bach-bwv1-bga-1851-p1.jpg`
  - J.S. Bach, BWV 1, first page of the Bach-Gesellschaft edition (1851), a full orchestral and choral score. 856 x 1162, low resolution. This is a hard case.
  - Source: https://commons.wikimedia.org/wiki/File:BGA_Vol._1,_p._1_(start_of_the_score_of_BWV_1),_1851.jpg
  - Rights: public domain.
- `star-spangled-banner-lyrics.png`
  - The Star-Spangled Banner, a modern typeset melody with lyrics. 659 x 1145, low resolution.
  - Source: https://commons.wikimedia.org/wiki/File:The_Star_Spangled_Banner_Score,_With_Lyrics.png
  - Rights: CC0, by Samvielsaa.
  - Has a transparency channel, so flatten it onto white.

## Photo

- `photo-music-stand-usaf-peru.jpg`
  - A camera photo of a tenor saxophone part on a music stand, shot at an angle and partly out of focus. 5568 x 3712.
  - Source: https://commons.wikimedia.org/wiki/File:Peruvian,_US_Air_Force_bands_host_joint_practice_(8479633).jpg
  - Rights: the photo is public domain (U.S. Air Force photo by Senior Airman Courtney Sebastianelli).
  - The music shown is "Freedom" by Jon Batiste, in an Air Force arrangement, which is still under copyright. Use it for local testing only, and don't commit it to a public repo.
  - At 20.7 megapixels, it's just over Audiveris's 20-megapixel limit, though homr-web may handle it.

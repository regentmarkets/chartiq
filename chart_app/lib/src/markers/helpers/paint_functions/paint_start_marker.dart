import 'package:deriv_chart/deriv_chart.dart';
import 'package:flutter/material.dart';

/// Paints start time marker
void paintStartMarker(
    Canvas canvas, Offset offset, MarkerStyle style, double iconSize) {
  const IconData icon = Icons.location_on;

  TextPainter(textDirection: TextDirection.ltr)
    ..text = TextSpan(
      text: String.fromCharCode(icon.codePoint),
      style: TextStyle(
        fontSize: iconSize,
        fontFamily: icon.fontFamily,
        color: style.backgroundColor,
      ),
    )
    ..layout()
    ..paint(
      canvas,
      offset,
    );
}

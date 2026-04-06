#include <iostream>
#include <fstream>
#include <string>
#include <vector>
#include <sstream>

int main(int argc, char* argv[]) {
    if (argc < 2) {
        std::cerr << "Usage: sentinel_logic <input.json>" << std::endl;
        return 1;
    }

    std::ifstream file(argv[1]);
    if (!file.is_open()) {
        std::cerr << "Failed to open file: " << argv[1] << std::endl;
        return 1;
    }

    std::stringstream buffer;
    buffer << file.rdbuf();
    std::string json = buffer.str();

    // Primitive JSON parsing
    double confidence = 0.0;
    size_t conf_pos = json.find("\"confidence\"");
    if (conf_pos != std::string::npos) {
        size_t colon_pos = json.find(":", conf_pos);
        size_t comma_pos = json.find(",", colon_pos);
        std::string conf_str = json.substr(colon_pos + 1, comma_pos - colon_pos - 1);
        confidence = std::stod(conf_str);
    }

    double primary_weight = 0.0;
    double primary_volatility = 0.0;
    std::string primary_feature = "Unknown";
    
    size_t feat_pos = json.find("\"feature\"");
    if (feat_pos != std::string::npos) {
        size_t colon_pos = json.find(":", feat_pos);
        size_t quote1 = json.find("\"", colon_pos);
        size_t quote2 = json.find("\"", quote1 + 1);
        primary_feature = json.substr(quote1 + 1, quote2 - quote1 - 1);
    }

    size_t weight_pos = json.find("\"weight\"");
    if (weight_pos != std::string::npos) {
        size_t colon_pos = json.find(":", weight_pos);
        size_t comma_pos = json.find(",", colon_pos);
        std::string weight_str = json.substr(colon_pos + 1, comma_pos - colon_pos - 1);
        primary_weight = std::stod(weight_str);
    }

    size_t vol_pos = json.find("\"volatility\"");
    if (vol_pos != std::string::npos) {
        size_t colon_pos = json.find(":", vol_pos);
        size_t end_posOuter = std::string::npos;
        size_t rbrace = json.find("}", colon_pos);
        size_t comma = json.find(",", colon_pos);
        size_t end_pos = (comma < rbrace && comma != std::string::npos) ? comma : rbrace;
        std::string vol_str = json.substr(colon_pos + 1, end_pos - colon_pos - 1);
        primary_volatility = std::stod(vol_str);
    }

    double stress_shift_pct = 30.0;
    size_t stress_pos = json.find("\"stress_shift_pct\"");
    if (stress_pos != std::string::npos) {
        size_t colon_pos = json.find(":", stress_pos);
        size_t comma_pos = json.find(",", colon_pos);
        size_t rbrace = json.find("}", colon_pos);
        size_t end_pos = (comma_pos < rbrace && comma_pos != std::string::npos) ? comma_pos : rbrace;
        std::string stress_str = json.substr(colon_pos + 1, end_pos - colon_pos - 1);
        try { stress_shift_pct = std::stod(stress_str); } catch(...) {}
    }

    // Core Logic
    double weight_shift = primary_weight * (stress_shift_pct / 100.0);
    double fragility_delta = (weight_shift * 100.0) * (1.0 + primary_volatility);
    double distance_to_inversion = confidence - 50.0;
    double breaking_point_shift = (distance_to_inversion / fragility_delta) * stress_shift_pct;

    std::cout << "{" << std::endl;
    std::cout << "  \"fragility_delta\": " << fragility_delta << "," << std::endl;
    std::cout << "  \"breaking_point_shift\": " << breaking_point_shift << "," << std::endl;
    std::cout << "  \"load_bearing_feature\": \"" << primary_feature << "\"," << std::endl;
    std::cout << "  \"analyzed_confidence\": " << confidence << std::endl;
    std::cout << "}" << std::endl;

    return 0;
}
